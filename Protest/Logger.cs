using System.IO;
#if DEBUG
using System.Runtime.CompilerServices;
#endif

namespace Protest;

internal static class Logger {
    private static readonly object syncLog = new object();

#if DEBUG
    public static void Error(Exception ex, [CallerLineNumber] int line = 0, [CallerMemberName] string caller = null, [CallerFilePath] string file = null) {
        ReadOnlySpan<char> span = file;
        int backslashIndex = span.LastIndexOf('\\');
        if (backslashIndex < 0) {
            Error($"{caller} ({file}:{line}) \t{ex.Message}");
        } else {
            Error($"{caller} ({span[(backslashIndex+1)..]}:{line}) \t{ex.Message}");
        }
    }
#else
    public static void Error(Exception ex) {
        Error(ex.Message);
    }
#endif

    public static void Error(string ex) {
        lock (syncLog)
            try {
                using StreamWriter writer = new StreamWriter($"{Strings.DIR_LOG}{Strings.DIRECTORY_SEPARATOR}error.log", true, System.Text.Encoding.UTF8);
                writer.Write(DateTime.Now.ToString(Strings.DATETIME_FORMAT_FILE));
                writer.WriteLine($"\t{ex}");
            } catch { }

        Console.ForegroundColor = ConsoleColor.Red;
        Console.Error.WriteLine(ex);
        Console.ResetColor();
    }

    public static void Action(string initiator, string action) {
        string msg = $"{DateTime.Now.ToString(Strings.DATETIME_FORMAT_FILE),-24}{initiator,-32}{action}";
        lock (syncLog)
            try {
                using StreamWriter writer = new StreamWriter($"{Strings.DIR_LOG}{Strings.DIRECTORY_SEPARATOR}{DateTime.Now.ToString(Strings.DATE_FORMAT_FILE)}.log", true, System.Text.Encoding.UTF8);
                writer.WriteLine(msg);
            } catch { }

        //KeepAlive.Broadcast($"{{\"action\":\"log\",\"msg\":\"{msg}\"}}");
    }

    public static byte[] Get() {
        byte[] bytes = null;
        lock (syncLog)
            try {
                bytes = File.ReadAllBytes($"{Strings.DIR_LOG}{Strings.DIRECTORY_SEPARATOR}{DateTime.Now.ToString(Strings.DATE_FORMAT_FILE)}.log");
            } catch { }

        return bytes;
    }
}