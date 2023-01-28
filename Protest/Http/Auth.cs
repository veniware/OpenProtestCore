using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text.Json;
using System.Text.Json.Serialization;
using Protest.Tools;

namespace Protest.Http;

internal static class Auth {
    private const long HOUR = 36_000_000_000L;
    private const long SESSION_TIMEOUT = 168L * HOUR; //7 days

    private static readonly ConcurrentDictionary<string, AccessControl> acl = new();
    private static readonly ConcurrentDictionary<string, Session> sessions = new();

    public record AccessControl {
        public string username;
        public string nickname;
        public byte[] hash;
        public string[] authorization;
        public bool isDirectoryUser;
    }

    public record Session {
        public AccessControl access;
        public IPAddress ip;
        public string sessionId;
        public long loginTime;
        public long sessionTimeout;
    }

    public static bool IsAuthenticated(in HttpListenerContext ctx) {
        string sessionId = ctx.Request.Cookies["sessionid"]?.Value ?? null;
        if (sessionId is null) return false;
        return IsAuthenticated(in sessionId);
    }
    public static bool IsAuthenticated(in string sessionId) {
        if (sessionId is null) return false;
        if (!sessions.ContainsKey(sessionId)) return false;

        Session session = sessions[sessionId];

        if (DateTime.Now.Ticks - session.loginTime > session.sessionTimeout) { //expired
            RevokeAccess(sessionId);
            return false;
        }

        return true;
    }

    public static bool IsAuthorized(in HttpListenerContext ctx, in string path) {
        string sessionId = ctx.Request.Cookies["sessionid"]?.Value ?? null;
        if (sessionId is null) return false;
        return IsAuthorized(in sessionId, path);
    }
    public static bool IsAuthorized(in string sessionId, string path) {
        if (sessionId is null) return false;
        if (!sessions.ContainsKey(sessionId)) return false;

        Session session = sessions[sessionId];
        return session.access.authorization.Any(v => path.StartsWith(v));
    }

    public static bool AttemptAuthenticate(in HttpListenerContext ctx, out string seesionId) {
        using StreamReader streamReader = new StreamReader(ctx.Request.InputStream);
        ReadOnlySpan<char> payload = streamReader.ReadToEnd().AsSpan();

        int index = payload.IndexOf((char)127);
        if (index == -1) {
            seesionId = null;
            return false;
        }

        string username = payload[..index].ToString().ToLower();
        string password = payload[(index + 1)..].ToString();

        if (!acl.ContainsKey(username)) {
            seesionId = null;
            return false;
        }

        //TODO: check all users access

        AccessControl access = acl[username];

        bool successfully = access.isDirectoryUser && OperatingSystem.IsWindows() ?
            ActiveDirectoryServices.TryDirectoryAuthenticate(username, password) :
            Cryptography.HashUsernameAndPassword(username, password).SequenceEqual(access.hash);

        if (successfully) {
            seesionId = GrandAccess(ctx, username);
            return true;
        }

        seesionId = null;
        return false;
    }

    public static string GrandAccess(in HttpListenerContext ctx, in string username) {
        string sessionId = Cryptography.RandomStringGenerator(64);

        ctx.Response.AddHeader("Set-Cookie", $"sessionid={sessionId}; Domain={ctx.Request.UserHostName.Split(':')[0]}; Max-age=604800; HttpOnly; SameSite=Strict; Secure;");

        Session newSession = new Session() {
            access         = acl.TryGetValue(username, out AccessControl value) ? value : default!,
            ip             = ctx.Request.RemoteEndPoint.Address,
            sessionId      = sessionId,
            loginTime      = DateTime.Now.Ticks,
            sessionTimeout = SESSION_TIMEOUT,
        };

        if (sessions.TryAdd(sessionId, newSession)) {
            return sessionId;
        }

        return null; 
    }

    public static bool RevokeAccess(in HttpListenerContext ctx, in string initiator) {
        string sessionId = ctx.Request.Cookies["sessionid"]?.Value ?? null;
        if (sessionId is null) return false;
        return RevokeAccess(sessionId, initiator);
    }
    public static bool RevokeAccess(in string sessionId, in string initiator = null) {
        if (sessionId is null) return false;
        if (!sessions.ContainsKey(sessionId)) return false;

        if (sessions.TryRemove(sessionId, out _)) {
            if (initiator != null) Logger.Action(initiator, $"User actively logged out");
            return true;
        }

        return false;
    }

    public static string GetUsername(in string sessionId) {
        if (sessionId is null) return null;

        if (sessions.TryGetValue(sessionId, out Session session))
            return session.access.username;

        return null;
    }

    public static bool StoreAcl() {
        DirectoryInfo dirAcl = new DirectoryInfo(Strings.DIR_ACL);
    
        if (!dirAcl.Exists) 
            try {
                dirAcl.Create();
            } catch {
                return false;
            }

        JsonSerializerOptions options = new JsonSerializerOptions();
        options.Converters.Add(new AccessControlJsonConverter());
#if DEBUG
        options.WriteIndented = true;
#endif

        foreach (AccessControl access in acl.Values) {
            byte[] plain = JsonSerializer.SerializeToUtf8Bytes<AccessControl>(access, options);
            byte[] cipher = Cryptography.Encrypt(plain, Configuration.DB_KEY, Configuration.DB_KEY_IV);

            try {
                File.WriteAllBytes($"{Strings.DIR_ACL}{Strings.DIRECTORY_SEPARATOR}{access.username}", cipher);
            } catch {
                continue;
            }
        }

        return true;
    }

    public static bool LoadAcl() {
        DirectoryInfo dirAcl = new DirectoryInfo(Strings.DIR_ACL);
        if (!dirAcl.Exists) return false;

        acl.Clear();

        JsonSerializerOptions options = new JsonSerializerOptions();
        options.Converters.Add(new AccessControlJsonConverter());

        FileInfo[] files = dirAcl.GetFiles();
        for (int i = 0; i < files.Length; i++) {
            byte[] cipher;
            try {
                cipher = File.ReadAllBytes(files[i].FullName.ToLower());
            } catch {
                continue;
            }

            byte[] plain = Cryptography.Decrypt(cipher, Configuration.DB_KEY, Configuration.DB_KEY_IV);

            AccessControl access = JsonSerializer.Deserialize<AccessControl>(plain, options);
            acl.TryAdd(access.username, access);
        }

        return true;
    }

}

internal sealed class AccessControlJsonConverter : JsonConverter<Auth.AccessControl> {
    public override Auth.AccessControl Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) {
        Auth.AccessControl access = new Auth.AccessControl();
        while (reader.Read()) {
            if (reader.TokenType == JsonTokenType.EndObject) break;
            
            if (reader.TokenType == JsonTokenType.PropertyName) {
                string propertyName = reader.GetString();
                reader.Read();

                if (propertyName == "username") {
                    access.username = reader.GetString();

                } else if (propertyName == "nickname") {
                    access.nickname = reader.GetString();

                } else if (propertyName == "hash") {
                    access.hash = Convert.FromHexString(reader.GetString());

                } else if (propertyName == "isDirectoryUser") {
                    access.isDirectoryUser = reader.GetBoolean();

                } else if (propertyName == "authorization") {
                    List<string> list = new List<string>();
                    while (reader.Read() && reader.TokenType != JsonTokenType.EndArray) {
                        list.Add(reader.GetString());
                    }
                    access.authorization = list.ToArray();

                } else {
                    reader.Skip();
                }
            }
        }
        return access;
    }

    public override void Write(Utf8JsonWriter writer, Auth.AccessControl value, JsonSerializerOptions options) {
        writer.WriteStartObject();

        writer.WriteString("username", value.username);
        writer.WriteString("nickname", value.nickname);
        writer.WriteString("hash", Convert.ToHexString(value.hash));
        writer.WriteBoolean("isDirectoryUser", value.isDirectoryUser);

        writer.WritePropertyName("authorization");
        writer.WriteStartArray();
        for (int i = 0; i < value.authorization.Length; i++) {
            writer.WriteStringValue(value.authorization[i]);
        }
        writer.WriteEndArray();

        writer.WriteEndObject();
    }
}