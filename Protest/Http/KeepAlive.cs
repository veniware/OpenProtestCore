using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Net;
using System.Net.WebSockets;
using System.Text;
using System.Threading;

namespace Protest.Http;

internal static class KeepAlive {
    private static readonly ArraySegment<byte> MSG_FORCE_RELOAD = new(Encoding.UTF8.GetBytes(@"{""action"":""forcereload""}"));

    private struct Entry {
        public WebSocket ws;
        public string id;
        public string username;
        public object syncLock;
    }

    private static readonly ConcurrentDictionary<WebSocket, Entry> connections = new();    

    public static async void WebSocketHandler(HttpListenerContext ctx) {
        WebSocket ws;

        try {
            WebSocketContext wsc = await ctx.AcceptWebSocketAsync(null);
            ws = wsc.WebSocket;
        } catch (WebSocketException ex) {
            ctx.Response.Close();
            Logger.Error(ex);
            return;
        }

        string sessionId = ctx.Request.Cookies["sessionid"]?.Value ?? null;
        string username = IPAddress.IsLoopback(ctx.Request.RemoteEndPoint.Address) ? "loopback" : Auth.GetUsername(sessionId);


        connections.TryAdd(ws, new Entry() {
            ws = ws,
            id = sessionId,
            username = username,
            syncLock = new object()
        });

        byte[] buff = new byte[2048];

        try {

            //init
            ArraySegment<byte> initSegment = new(Encoding.UTF8.GetBytes($"{{\"action\":\"init\",\"version\":\"{Strings.VersionToString()}\",\"username\":\"{username}\"}}"));
            await ws.SendAsync(initSegment, WebSocketMessageType.Text, true, CancellationToken.None);
    
            while (ws.State == WebSocketState.Open) {

                if (Auth.IsAuthenticated(sessionId)) {
                    await ws.SendAsync(MSG_FORCE_RELOAD, WebSocketMessageType.Text, true, CancellationToken.None);
                    await ws.CloseOutputAsync(WebSocketCloseStatus.NormalClosure, null, CancellationToken.None);
                    return;
                }

                WebSocketReceiveResult receive = await ws.ReceiveAsync(new ArraySegment<byte>(buff), CancellationToken.None);

                if (receive.MessageType == WebSocketMessageType.Close) {
                    await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, null, CancellationToken.None);
                    break;
                }

                string msg = Encoding.Default.GetString(buff, 0, receive.Count);

                //await ws.SendAsync(Strings.CODE_ACK, WebSocketMessageType.Text, true, CancellationToken.None);
            }

        } catch (WebSocketException ex) {
            ctx.Response.Close();
            Logger.Error(ex);
        }
        
        connections.Remove(ws, out _);
    }

    public static void Broadcast(string message) {
        Broadcast(Encoding.UTF8.GetBytes(message));
    }

    public static void Broadcast(byte[] message) {
        foreach (Entry entry in connections.Values) {
            Console.WriteLine(entry.id);
            Encoding.UTF8.GetString(message);
        }
    }

}