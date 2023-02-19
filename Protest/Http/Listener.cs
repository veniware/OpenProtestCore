#if NET7_0_OR_GREATER
//#define DEFLATE
#define BROTLI
#endif

using System.Net;

namespace Protest.Http;

public sealed class Listener {
    private readonly HttpListener listener;
    private readonly Cache cache;

    public Listener(string ip, ushort port, string path) {
        if (!HttpListener.IsSupported) throw new NotSupportedException();
        cache = new Cache(path);
        listener = new HttpListener();
        Bind(new string[] { $"http://{ip}:{port}/" });
    }

    public Listener(string[] uriPrefixes, string path) {
        if (!HttpListener.IsSupported) throw new NotSupportedException();
        cache = new Cache(path);
        listener = new HttpListener();
        Bind(uriPrefixes);
    }

    ~Listener() {
        Stop();
    }

    private void Bind(string[] uriPrefixes) {
        listener.IgnoreWriteExceptions = true;

        for (int i = 0; i < uriPrefixes.Length; i++)
            listener.Prefixes.Add(uriPrefixes[i]);

        try {
            listener.Start();
        } catch (HttpListenerException ex) {
            Logger.Error(ex);
            throw ex;
        }
    }

    public void Start() {
        while (listener.IsListening) {
            IAsyncResult result = listener.BeginGetContext(ListenerCallback, listener);
            result.AsyncWaitHandle.WaitOne();
        }

        Console.WriteLine("Listener stopped");
    }

    public void Stop() {
        if (listener is not null && listener.IsListening) listener.Stop();
        listener.Abort();
    }

    private void ListenerCallback(IAsyncResult result) {
        HttpListenerContext ctx = listener.EndGetContext(result);

        if (ctx.Request.UrlReferrer != null) { //Cross Site Request Forgery protection
            if (!string.Equals(ctx.Request.UrlReferrer.Host, ctx.Request.UserHostName.Split(':')[0], StringComparison.Ordinal)) {
                ctx.Response.StatusCode = 418; //I'm a teapot
                ctx.Response.Close();
                return;
            }
            if (Uri.IsWellFormedUriString(ctx.Request.UrlReferrer.Host, UriKind.Absolute)) {
                ctx.Response.StatusCode = 418; //I'm a teapot
                ctx.Response.Close();
                return;
            }
            UriHostNameType type = Uri.CheckHostName(ctx.Request.UrlReferrer.Host);
            if (type != UriHostNameType.Dns && type != UriHostNameType.IPv4 && type != UriHostNameType.IPv6) {
                ctx.Response.StatusCode = 418; //I'm a teapot
                ctx.Response.Close();
                return;
            }
        }

        string path = ctx.Request.Url.PathAndQuery;

        if (string.Equals(path, "/auth", StringComparison.Ordinal)) {
            if (!string.Equals(ctx.Request.HttpMethod, "POST", StringComparison.Ordinal)) {
                ctx.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                ctx.Response.Close();
                return;
            }

            ctx.Response.StatusCode = Auth.AttemptAuthenticate(ctx, out _) ?
                (int)HttpStatusCode.Accepted :
                (int)HttpStatusCode.Unauthorized;

            ctx.Response.Close();
            return;
        }

        if (CacheHandler(ctx, path)) return;

        IPAddress remoteIp = ctx.Request.RemoteEndPoint.Address;
        bool isLoopback = IPAddress.IsLoopback(remoteIp);

        bool isAuthenticated = isLoopback || Auth.IsAuthenticated(ctx);
        bool isAuthorized = isLoopback || Auth.IsAuthorized(ctx, path);
        //bool isAuthenticated = Auth.IsAuthenticated(ctx);
        //bool isAuthorized = Auth.IsAuthorized(ctx, path);

        if (!isAuthenticated) {
            ctx.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
            ctx.Response.Close();
            return;
        }

        if (!isAuthorized) {
            ctx.Response.StatusCode = (int)HttpStatusCode.Forbidden;
            ctx.Response.Close();
            return;
        }

        if (DynamicHandler(ctx)) return;
        if (WebSocketHandler(ctx, path)) return;

        ctx.Response.StatusCode = (int)HttpStatusCode.NotFound;
        ctx.Response.Close();
    }

    private bool CacheHandler(HttpListenerContext ctx, string path) {
        if (!cache.cache.ContainsKey(path)) return false;

        Cache.Entry entry;
        if (string.Equals(path, "/", StringComparison.Ordinal)) {
            IPAddress remoteIp = ctx.Request.RemoteEndPoint.Address;
            bool isLoopback = IPAddress.IsLoopback(remoteIp);
            bool isAuthenticated = isLoopback || Auth.IsAuthenticated(ctx);
            //bool isAuthenticated = Auth.IsAuthenticated(ctx);

            if (!isAuthenticated) {
                entry = cache.cache.TryGetValue("/login", out Cache.Entry value) ? value : default;
            } else {
                entry = cache.cache["/"];
            }

        } else {
            entry = cache.cache[path];
        }

        string acceptEncoding = ctx.Request.Headers.Get("Accept-Encoding")?.ToLower() ?? String.Empty;
        bool acceptGzip = acceptEncoding.Contains("gzip");
#if BROTLI
        bool acceptBrotli = acceptEncoding.Contains("br");
#endif
#if DEFLATE
        bool acceptDeflate = acceptEncoding.Contains("deflate");
#endif

        byte[] buffer;
#if BROTLI
        if (acceptBrotli && entry.brotli is not null) { //brotli
            buffer = entry.brotli;
            ctx.Response.AddHeader("Content-Encoding", "br");
        } else
#endif
#if DEFLATE
        if (acceptDeflate && entry.deflate is not null) { //deflate
            buffer = entry.deflate;
            ctx.Response.AddHeader("Content-Encoding", "deflate");
        } else
#endif
        if (acceptGzip && entry.gzip is not null) { //gzip
            buffer = entry.gzip;
            ctx.Response.AddHeader("Content-Encoding", "gzip");
        } else { //raw
            buffer = entry.bytes;
        }
        
        ctx.Response.StatusCode = (int)HttpStatusCode.OK;
        ctx.Response.ContentType = entry.contentType;
        ctx.Response.AddHeader("Length", buffer?.Length.ToString() ?? "0");

        for (int i = 0; i < entry.headers.Length; i++) {
            ctx.Response.AddHeader(entry.headers[i].Key, entry.headers[i].Value);
        }

        try {
            if (buffer is not null) ctx.Response.OutputStream.Write(buffer, 0, buffer.Length);
            ctx.Response.OutputStream.Flush();
#if DEBUG
        } catch (HttpListenerException ex) {
            Console.Error.WriteLine(ex.Message);
            Console.Error.WriteLine(ex.StackTrace);
        }
#else
        } catch (HttpListenerException) { /*do nothing*/ }
#endif

        ctx.Response.Close();
        return true;
    }

    private static bool DynamicHandler(HttpListenerContext ctx) {
        string sessionId = ctx.Request.Cookies["sessionid"]?.Value ?? null;
        string username = IPAddress.IsLoopback(ctx.Request.RemoteEndPoint.Address) ? "loopback" : Auth.GetUsername(sessionId);

        byte[] buffer;

        switch (ctx.Request.Url.AbsolutePath) {
            case "/logout"  : buffer = Auth.RevokeAccess(sessionId, username) ? Strings.CODE_OK.Array : Strings.CODE_FAILED.Array; break;

            case "/db/getdevices"         : buffer = DatabaseInstances.devices.Serialize(); break;
            case "/db/getusers"           : buffer = DatabaseInstances.users.Serialize(); break;
            case "/db/getdeviceattribute" : buffer = DatabaseInstances.devices.GetAttribute(ctx.Request.Url.Query); break;
            case "/db/getuserattribute"   : buffer = DatabaseInstances.users.GetAttribute(ctx.Request.Url.Query); break;
            case "/db/savedevice"         : buffer = DatabaseInstances.devices.SaveHandler(ctx, username); break;
            case "/db/saveuser"           : buffer = DatabaseInstances.users.SaveHandler(ctx, username); break;

            default: return false;
        }
        
        if (buffer != null) ctx.Response.OutputStream.Write(buffer, 0, buffer.Length);
        ctx.Response.AddHeader("Length", buffer?.Length.ToString() ?? "0");

        ctx.Response.StatusCode = (int)HttpStatusCode.OK;
        ctx.Response.Close();
        return true;
    }

    private static bool WebSocketHandler(HttpListenerContext ctx, string path) {
        if (!ctx.Request.IsWebSocketRequest) {
            return false;
        }
        
        switch (path) {
            case "/ws/keepalive":
            KeepAlive.WebSocketHandler(ctx);
            return true;                

            case "/ws/ping":
                break;

            case "/ws/portscan":
                break;

            case "/ws/traceroute":
                break;

            case "/ws/telnet":
                break;

            case "/ws/watchdog":
                break;
        }

        return false;
    }

    public override string ToString() {

        string s = string.Empty;
        foreach (string prefix in listener.Prefixes)
            s += (s.Length == 0 ? String.Empty : "\n") + "Listening on " + prefix;
        return s;
    }
}