using System.IO;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Net;

namespace Protest;

public sealed class Database {
    public enum SaveMethod {
        ignore    = 0,
        createnew = 1,
        overwrite = 2,
        append    = 3,
        merge     = 4
    }

    [Serializable]
    public record Attribute {
        public string value;
        public string initiator;
        public long date; //utc
    }

    [Serializable]
    public record Entry {
        public string filename;
        public SynchronizedDictionary<string, Attribute> attributes;
        public object syncWrite;
    }

    private readonly string name;
    private readonly string location;
    private readonly ConcurrentDictionary<string, Entry> dictionary;
    private long version = 0;

    private long lastCachedVersion = -1;
    private byte[] lastCached;

    public Database(string name, string location) {
        this.name = name;
        this.location = location;
        dictionary = new ConcurrentDictionary<string, Entry>();
        ReadAll();
    }

    public static string GenerateFilename(int offset = 0) {
        return (DateTime.UtcNow.Ticks + offset).ToString("x");
    }

    private void ReadAll() {
        DirectoryInfo dir = new DirectoryInfo(location);
        if (!dir.Exists) return;

        bool successful = false;
        FileInfo[] files = dir.GetFiles();

        for (int i = 0; i < files.Length; i++) {
            Entry entry = Read(files[i]);
            if (entry is null) continue;

            dictionary.Remove(files[i].Name, out _);
            dictionary.TryAdd(files[i].Name, entry);
            successful = true;
        }

        if (successful)
            version = DateTime.UtcNow.Ticks;
    }

    private static Entry Read(FileInfo file) {
        JsonSerializerOptions options = new JsonSerializerOptions();
        options.Converters.Add(new AttributeListJsonConverter());

        try {
            byte[] bytes = File.ReadAllBytes(file.FullName);
            string plain = Encoding.UTF8.GetString(Cryptography.Decrypt(bytes, Configuration.DB_KEY, Configuration.DB_KEY_IV));
            return new Entry {
                filename = file.Name,
                attributes = JsonSerializer.Deserialize<SynchronizedDictionary<string, Attribute>>(plain, options),
                syncWrite = new object()
            };

        } catch (Exception ex) {
            Logger.Error(ex);
            return null;
        }
    }

    private bool Write(Entry entry, long lastModTimestamp) {
        string filename = $"{location}{Strings.DIRECTORY_SEPARATOR}{entry.filename}";

        if (lastModTimestamp > 0) {
            try { //create timeline file
                if (File.Exists(filename)) {
                    DirectoryInfo timelineDir = new DirectoryInfo($"{filename}_");
                    if (!timelineDir.Exists) timelineDir.Create();
                    File.Move(filename, $"{filename}_{Strings.DIRECTORY_SEPARATOR}{lastModTimestamp}");
                }
            } catch { }
        }

        JsonSerializerOptions options = new JsonSerializerOptions();
        options.Converters.Add(new AttributeListJsonConverter());
#if DEBUG
        options.WriteIndented = true;
#endif

        string json;
        json = JsonSerializer.Serialize(entry.attributes, options);

        byte[] plain = Encoding.UTF8.GetBytes(json);
        byte[] cipher = Cryptography.Encrypt(plain, Configuration.DB_KEY, Configuration.DB_KEY_IV);

        try {
            lock (entry.syncWrite)
                File.WriteAllBytes(filename, cipher);
        } catch (Exception ex) {
            Logger.Error(ex);
            return false;
        }

        return true;
    }

    public bool Delete(string filename, string initiator) {
        if (!dictionary.ContainsKey(filename)) {
            return false;
        }

        dictionary.Remove(filename, out _);

        try {
            File.Delete($"{location}{Strings.DIRECTORY_SEPARATOR}{filename}");
        } catch (Exception ex) {
            Logger.Error(ex);
            return false;
        }

        Logger.Action(initiator, $"Delete entry from {this.name} database: {filename}");

        return true;
    }

    public bool Delete(Entry entry, string initiator) {
        return Delete(entry.filename, initiator);
    }

    public bool Save(string filename, SynchronizedDictionary<string, Attribute> modifications, SaveMethod method, string initiator) {
        if (filename is null || filename.Length == 0)
            filename = GenerateFilename();

        bool exist = dictionary.ContainsKey(filename);
        if (!exist) method = SaveMethod.createnew;

        dictionary.Remove(filename, out Entry oldEntry);

        long lastModTimestamp = 0;
        if (oldEntry is not null) {
            foreach (Attribute attr in oldEntry.attributes.Values) {
                lastModTimestamp = Math.Max(lastModTimestamp, attr.date);
            }
        }

        Entry newEntry = method switch {
            SaveMethod.ignore    => null,
            SaveMethod.createnew => SaveNew(filename, modifications, initiator),                 //keep the old file, create new
            SaveMethod.overwrite => SaveOverwrite(filename, modifications, oldEntry, initiator), //ignore previous attributes
            SaveMethod.append    => SaveAppend(filename, modifications, oldEntry, initiator),    //append new attributes
            SaveMethod.merge     => SaveMerge(filename, modifications, oldEntry, initiator),     //merged all attributes
            _ => throw new NotImplementedException(),
        };

        if (newEntry is null) return true;

        dictionary.TryAdd(filename, newEntry);
        version = DateTime.UtcNow.Ticks;

        //new Thread(() => { Write(newEntry); }).Start();
        //return true;

        return Write(newEntry, lastModTimestamp);
    }

    private Entry SaveNew(string filename, SynchronizedDictionary<string, Attribute> modifications, string initiator) {
        Entry newEntry = new Entry() {
            filename = dictionary.ContainsKey(filename) ? GenerateFilename(1) : filename,
            attributes = modifications,
            syncWrite = new object()
        };

        Logger.Action(initiator, $"Create a new entry on {this.name} database: {filename}");
        return newEntry;
    }    
    private Entry SaveOverwrite(string filename, SynchronizedDictionary<string, Attribute> modifications, Entry oldEntry, string initiator) {
        //dictionary.Remove(filename, out Entry oldEntry);

        //keep old initiator and date, if data didn't change
        foreach (KeyValuePair<string, Attribute> pair in modifications) {
            if (!oldEntry.attributes.ContainsKey(pair.Key)) continue;
            if (pair.Value.value != oldEntry.attributes[pair.Key].value) continue;
            pair.Value.initiator = oldEntry.attributes[pair.Key].initiator;
            pair.Value.date = oldEntry.attributes[pair.Key].date;
        }

        oldEntry.attributes = modifications;

        Logger.Action(initiator, $"Overwrite entry on {this.name} database: {filename}");
        return oldEntry;
    }
    private Entry SaveAppend(string filename, SynchronizedDictionary<string, Attribute> modifications, Entry oldEntry, string initiator) {
        //dictionary.Remove(filename, out Entry oldEntry);

        foreach (KeyValuePair<string, Attribute> pair in modifications) {
            if (!oldEntry.attributes.ContainsKey(pair.Key)) {
                oldEntry.attributes.TryAdd(pair.Key, pair.Value);
            }
        }

        Logger.Action(initiator, $"Append on entry {this.name} database: {filename}");
        return oldEntry;
    }
    private Entry SaveMerge(string filename, SynchronizedDictionary<string, Attribute> modifications, Entry oldEntry, string initiator) {
        //dictionary.Remove(filename, out Entry oldEntry);

        foreach (KeyValuePair<string, Attribute> pair in oldEntry.attributes) {
            if (!modifications.ContainsKey(pair.Key)) {
                modifications.TryAdd(pair.Key, pair.Value);
            }
        }

        oldEntry.attributes = modifications;

        Logger.Action(initiator, $"Marge with entry on {this.name} database: {filename}");        
        return oldEntry;
    }

    public Entry GetEntry(string filename) {
        if (dictionary.TryGetValue(filename, out Entry entry)) return entry;
        return null;
    }

    public byte[] SaveHandler(HttpListenerContext ctx, string initiator) {
        string filename = null;

        ReadOnlySpan<char> querySpan = ctx.Request.Url.Query.AsSpan();
        if (querySpan.StartsWith("?")) querySpan = querySpan[1..];

        int startIndex = 0;
        while (startIndex < querySpan.Length) {
            int endIndex = querySpan[startIndex..].IndexOf('&');
            if (endIndex == -1) endIndex = querySpan.Length;

            ReadOnlySpan<char> attr = querySpan[startIndex..endIndex];
            if (attr.StartsWith("file=", StringComparison.OrdinalIgnoreCase))
                filename = Uri.UnescapeDataString(attr[5..].ToString());

            startIndex = endIndex + 1;
        }

        filename ??= GenerateFilename();

        string payload;
        using (StreamReader reader = new StreamReader(ctx.Request.InputStream, ctx.Request.ContentEncoding))
            payload = reader.ReadToEnd();

        if (payload.Length == 0) return Strings.CODE_INVALID_ARGUMENT.Array;

        JsonSerializerOptions options = new JsonSerializerOptions();
        options.Converters.Add(new AttributeListJsonConverter());
        SynchronizedDictionary<string, Attribute> modifications = JsonSerializer.Deserialize<SynchronizedDictionary<string, Attribute>>(payload, options);

        foreach (KeyValuePair<string, Attribute> pair in modifications) {
            pair.Value.initiator = initiator;
            pair.Value.date = DateTime.UtcNow.Ticks;
        }

        if (Save(filename, modifications, SaveMethod.overwrite, initiator)) {
            return Encoding.UTF8.GetBytes($"{{\"status\":\"ok\", \"filename\":\"{filename}\"}}");
        }

        return Strings.CODE_FAILED.Array;
    }

    public byte[] DeleteHandler(HttpListenerContext ctx, string initiator) {
        string filename = null;

        ReadOnlySpan<char> querySpan = ctx.Request.Url.Query.AsSpan();
        if (querySpan.StartsWith("?")) querySpan = querySpan[1..];

        int startIndex = 0;
        while (startIndex < querySpan.Length) {
            int endIndex = querySpan[startIndex..].IndexOf('&');
            if (endIndex == -1) endIndex = querySpan.Length;

            ReadOnlySpan<char> attr = querySpan[startIndex..endIndex];
            if (attr.StartsWith("file=", StringComparison.OrdinalIgnoreCase))
                filename = Uri.UnescapeDataString(attr[5..].ToString());

            startIndex = endIndex + 1;
        }

        if (filename is null) {
            return Strings.CODE_INVALID_ARGUMENT.Array;
        }

        if (Delete(filename, initiator)) {
            return Strings.CODE_OK.Array;
        } else {
            return Strings.CODE_FILE_NOT_FOUND.Array;
        }
    }

    public byte[] TimelineHandler(HttpListenerContext ctx) {
        string file = null;

        ReadOnlySpan<char> querySpan = ctx.Request.Url.Query.AsSpan();
        if (querySpan.StartsWith("?")) querySpan = querySpan[1..];

        int startIndex = 0;
        while (startIndex < querySpan.Length) {
            int endIndex = querySpan[startIndex..].IndexOf('&');
            if (endIndex == -1) endIndex = querySpan.Length;

            ReadOnlySpan<char> attr = querySpan[startIndex..endIndex];
            if (attr.StartsWith("file=", StringComparison.OrdinalIgnoreCase))
                file = Uri.UnescapeDataString(attr[5..].ToString());

            startIndex = endIndex + 1;
        }

        if (file is null) {
            return Strings.CODE_INVALID_ARGUMENT.Array;
        }

        string fullname = $"{location}{Strings.DIRECTORY_SEPARATOR}{file}";

        StringBuilder builder = new StringBuilder();

        try {        
            DirectoryInfo timelineDir = new DirectoryInfo($"{fullname}_");
            if (!timelineDir.Exists) return Strings.CODE_FILE_NOT_FOUND.Array;
            
            FileInfo[] files = timelineDir.GetFiles();

            builder.Append('{');
            for (int i = 0; i < files.Length; i++) {
                if (i > 0) builder.Append(',');
                builder.Append($"\"{files[i].Name}\":");

                try {
                    byte[] bytes = File.ReadAllBytes(files[i].FullName);
                    string plain = Encoding.UTF8.GetString(Cryptography.Decrypt(bytes, Configuration.DB_KEY, Configuration.DB_KEY_IV));
                    builder.Append(plain);
                } catch {
                    builder.Append("null");
                }
            }
            builder.Append('}');
        } catch { }

        return Encoding.UTF8.GetBytes(builder.ToString());
    }

    public byte[] Serialize() {
        if (lastCachedVersion == version) {
            return lastCached;
        }

        JsonSerializerOptions options = new JsonSerializerOptions();
        options.Converters.Add(new EntryJsonConverter());

        StringBuilder payload = new StringBuilder();
        payload.Append('{');
        payload.Append($"\"version\":{version},");
        payload.Append($"\"length\":{dictionary.Count},");

        payload.Append($"\"data\":{{");

        bool isFirst = true;
        foreach (KeyValuePair<string, Entry> pair in dictionary) {
            if (!isFirst) payload.Append(',');
            payload.Append(JsonSerializer.Serialize(pair.Value, options));
            isFirst = false;
        }

        payload.Append("}}");

        lastCachedVersion = version;
        lastCached = Encoding.UTF8.GetBytes(payload.ToString());

        return lastCached;
    }

    public byte[] GetAttribute(string query) {
        string filename = String.Empty;
        string attribute = String.Empty;

        ReadOnlySpan<char> querySpan = query.AsSpan();
        if (querySpan.StartsWith("?")) querySpan = querySpan[1..];

        int startIndex = 0;
        while (startIndex < querySpan.Length) {
            int endIndex = querySpan[startIndex..].IndexOf('&');
            if (endIndex == -1) endIndex = querySpan.Length;

            ReadOnlySpan<char> attr = querySpan[startIndex..endIndex];
            if (attr.StartsWith("filename=", StringComparison.OrdinalIgnoreCase))
                filename = attr[9..].ToString();
            else if (attr.StartsWith("attribute=", StringComparison.OrdinalIgnoreCase))
                attribute = attr[10..].ToString();

            startIndex = endIndex + 1;
        }

        return GetAttribute(filename, attribute);
    }
    public byte[] GetAttribute(string filename, string attributeName) {
        if (filename.Length == 0) return null;
        if (attributeName.Length == 0) return null;

        dictionary.TryGetValue(filename, out Entry entry);
        if (entry == null) return null;

        attributeName = Uri.UnescapeDataString(attributeName);

        if (entry.attributes.TryGetValue(attributeName, out Attribute value)) return Encoding.UTF8.GetBytes(value.value);

        return null;
    }
}


internal sealed class EntryJsonConverter : JsonConverter<Database.Entry> {
    private readonly AttributeListJsonConverter attributeListConverter = new AttributeListJsonConverter();

    public override Database.Entry Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) {
        return null;
    }

    public override void Write(Utf8JsonWriter writer, Database.Entry value, JsonSerializerOptions options) {
        writer.WritePropertyName(value.filename);
        attributeListConverter.Write(writer, value.attributes, options);
    }
}


internal sealed class AttributeListJsonConverter : JsonConverter<SynchronizedDictionary<string, Database.Attribute>> {

    public override SynchronizedDictionary<string, Database.Attribute> Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) {
        SynchronizedDictionary<string, Database.Attribute> dictionary = new SynchronizedDictionary<string, Database.Attribute>();

        reader.Read(); //root object

        while (reader.TokenType != JsonTokenType.EndObject) {
            //reader.Read(); //attribute object

            string key = reader.GetString();

            Database.Attribute attr = new Database.Attribute();
            //attr.name = key;

            while (reader.TokenType != JsonTokenType.EndObject) {
                string propertyName = reader.GetString();

                reader.Read(); //start obj

                if (propertyName == "v") {
                    attr.value = reader.GetString();

                } else if (propertyName == "i") {
                    attr.initiator = reader.GetString();

                } else if (propertyName == "d") {
                    attr.date = reader.GetInt64();
                }

                reader.Read(); //end obj
            }

            dictionary.Add(key, attr);

            reader.Read(); //end attribute object token
        }

        reader.Read(); //end of root object token

        return dictionary;
    }

    public override void Write(Utf8JsonWriter writer, SynchronizedDictionary<string, Database.Attribute> value, JsonSerializerOptions options) {
        writer.WriteStartObject();

        foreach (KeyValuePair<string, Database.Attribute> pair in value) {
            writer.WritePropertyName(pair.Key);

            writer.WriteStartObject();
            writer.WriteString("v", pair.Value.value);
            writer.WriteString("i", pair.Value.initiator);
            writer.WriteNumber("d", pair.Value.date);
            writer.WriteEndObject();
        }

        writer.WriteEndObject();
    }
}
