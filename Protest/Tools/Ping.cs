using System.Collections;
using System.Collections.Generic;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Protest.Tools; 

internal static class Ping {
    public static async void Ws_Ping(HttpListenerContext ctx) {
        WebSocketContext wsc;
        WebSocket ws;
        try {
            wsc = await ctx.AcceptWebSocketAsync(null);
            ws = wsc.WebSocket;
        } catch (WebSocketException ex) {
            ctx.Response.Close();
            Logger.Error(ex);
            return;
        }

        string sessionId = ctx.Request.Cookies["sessionid"]?.Value ?? null;

        if (sessionId is null) {
            ctx.Response.Close();
            return;
        }

        Hashtable hostnames = new Hashtable();
        object syncSend = new object();

        int timeout = 1000;
        int method = 0; //0:icmp, 1:arp

        try {
            while (ws.State == WebSocketState.Open) {
                byte[] buff = new byte[2048];
                WebSocketReceiveResult receiveResult = await ws.ReceiveAsync(new ArraySegment<byte>(buff), CancellationToken.None);

                //TODO:
                /*if (!Session.CheckAccess(sessionId)) { //check session
                    ctx.Response.Close();
                    return;
                }*/

                if (receiveResult.MessageType == WebSocketMessageType.Close) {
                    await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, String.Empty, CancellationToken.None);
                    break;
                }

                string[] msg = Encoding.Default.GetString(buff, 0, receiveResult.Count).Split(':');
                if (msg.Length < 2) continue;

                switch (msg[0]) {
                    case "add":
                        string[] h = msg[1].Split(';');
                        if (h.Length > 1) {
                            for (int i = 0; i < h.Length - 1; i += 2) {
                                h[i] = h[i].Trim();
                                h[i + 1] = h[i + 1].Trim();
                                if (h[i].Length > 0 && h[i + 1].Length > 0 && !hostnames.ContainsKey(h[i]))
                                    hostnames.Add(h[i], h[i + 1]);
                                else
                                    await ws.SendAsync(Strings.CODE_INV, WebSocketMessageType.Text, true, CancellationToken.None);
                            }
                            await ws.SendAsync(Strings.CODE_ACK, WebSocketMessageType.Text, true, CancellationToken.None);
                        } else
                            await ws.SendAsync(Strings.CODE_INV, WebSocketMessageType.Text, true, CancellationToken.None);
                        break;

                    case "remove":
                        string value = msg[1].Trim();
                        if (hostnames.Contains(value)) {
                            hostnames.Remove(value);
                            await ws.SendAsync(Strings.CODE_ACK, WebSocketMessageType.Text, true, CancellationToken.None);
                        } else
                            await ws.SendAsync(Strings.CODE_INV, WebSocketMessageType.Text, true, CancellationToken.None);
                        break;

                    case "timeout":
                        _ = int.TryParse(msg[1], out timeout);
                        break;

                    case "method":
                        method = msg[1] == "arp" ? 1 : 0;
                        break;

                    case "ping":
                        new Thread(() => {
                            int i = 0;
                            string[] name = new string[hostnames.Count];
                            string[] id = new string[hostnames.Count];

                            foreach (DictionaryEntry o in hostnames) {
                                id[i] = o.Key.ToString();
                                name[i] = o.Value.ToString();
                                i++;
                            }

                            Task<string> s = (method == 0) ? PingArrayAsync(name, id, timeout) : ArpPingArrayAsync(name, id);
                            s.Wait();

                            lock (syncSend) { //one send per 
                                ws.SendAsync(new ArraySegment<byte>(Encoding.ASCII.GetBytes(s.Result), 0, s.Result.Length), WebSocketMessageType.Text, true, CancellationToken.None);
                            }
                        }).Start();
                        break;
                }
            }

        } catch (Exception ex) {
            Logger.Error(ex);
        }
    }
    public static async Task<string> PingArrayAsync(string[] name, string[] id, int timeout) {
        List<Task<string>> tasks = new List<Task<string>>();
        for (int i = 0; i < name.Length; i++) tasks.Add(PingAsync(name[i], id[i], timeout));
        string[] result = await Task.WhenAll(tasks);
        return String.Join(((char)127).ToString(), result);
    }
    public static async Task<string> PingAsync(string hostname, string id, int timeout) {
        System.Net.NetworkInformation.Ping p = new System.Net.NetworkInformation.Ping();

        try {
            PingReply reply = await p.SendPingAsync(hostname, timeout);
            if (reply.Status == IPStatus.Success)
                return id + ((char)127).ToString() + reply.RoundtripTime.ToString();

            else if (reply.Status == IPStatus.DestinationHostUnreachable || reply.Status == IPStatus.DestinationNetworkUnreachable)
                return id + ((char)127).ToString() + "Unreachable";

            else {
                //https://docs.microsoft.com/en-us/windows/desktop/api/ipexport/ns-ipexport-icmp_echo_reply32
                string r = reply.Status.ToString();
                if (r == "11050")
                    return id + ((char)127).ToString() + "General failure";
                else
                    return id + ((char)127).ToString() + reply.Status.ToString();
            }

        } catch (ArgumentException) {
            return id + ((char)127).ToString() + "Invalid address";

        } catch (PingException) {
            return id + ((char)127).ToString() + "Ping error";

        } catch (Exception) {
            return id + ((char)127).ToString() + "Unknown error";

        } finally {
            p.Dispose();
        }
    }

    public static async Task<string> ArpPingArrayAsync(string[] name, string[] id) {
        List<Task<string>> tasks = new List<Task<string>>();
        for (int i = 0; i < name.Length; i++) tasks.Add(ArpPingAsync(name[i], id[i]));
        string[] result = await Task.WhenAll(tasks);
        return String.Join(((char)127).ToString(), result);
    }

    public static async Task<string> ArpPingAsync(string name, string id) {
        try {
            IPAddress[] ips = await System.Net.Dns.GetHostAddressesAsync(name);
            if (ips.Length == 0) return id + ((char)127).ToString() + "unknown host";

            IPAddress ip = ips.First(o => o.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork);
            if (!IpTools.OnSameNetwork(ips[0])) return id + ((char)127).ToString() + "unknown net.";

            string response = Arp.ArpRequest(ip.ToString());

            if (response is not null && response.Length > 0)
                return id + ((char)127).ToString() + "0";

            return id + ((char)127).ToString() + "unreachable";
        } catch (Exception) {
            return id + ((char)127).ToString() + "unknown error";
        }
    }

}
