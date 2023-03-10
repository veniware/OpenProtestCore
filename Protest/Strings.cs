using System.IO;
using System.Reflection;
using System.Text;

namespace Protest;

public static class Strings {
    public const string GUID = "72f5bca3-7752-45e8-8027-2060ebbda456"; //from Protest.csproj

#if OS_LINUX || OS_MAC
    public const char DIRECTORY_SEPARATOR = '/';
#else //OS_WINDOWS
    public const char DIRECTORY_SEPARATOR = '\\';
#endif


    public const string TIME_FORMAT = "HH:mm:ss";
    public const string TIME_FORMAT_MILLI = "HH:mm:ss:fff";
    public const string DATE_FORMAT = "dd-MM-yyyy";
    public const string DATE_FORMAT_FILE = "yyyy-MM-dd";
    public const string DATETIME_FORMAT = "ddd, dd MMM yyyy HH:mm:ss";
    public const string DATETIME_FORMAT_LONG = "dddd dd MMM yyyy HH:mm:ss";
    public const string DATETIME_FORMAT_FILE = "yyyy-MM-dd HH:mm:ss";

    //pre-baked json responses:
    public static readonly ArraySegment<byte> CODE_OK  = new ArraySegment<byte>(Encoding.UTF8.GetBytes("{\"status\":\"ok\"}"));
    public static readonly ArraySegment<byte> CODE_ACK = new ArraySegment<byte>(Encoding.UTF8.GetBytes("{\"status\":\"acknowledge\"}"));

    public static readonly ArraySegment<byte> CODE_FAILED                 = new ArraySegment<byte>(Encoding.UTF8.GetBytes("{\"error\":\"failed\"}"));
    public static readonly ArraySegment<byte> CODE_UNAUTHORIZED           = new ArraySegment<byte>(Encoding.UTF8.GetBytes("{\"error\":\"unauthorized\"}"));
    public static readonly ArraySegment<byte> CODE_INVALID_ARGUMENT       = new ArraySegment<byte>(Encoding.UTF8.GetBytes("{\"error\":\"invalid argument\"}"));
    public static readonly ArraySegment<byte> CODE_NOT_FOUND              = new ArraySegment<byte>(Encoding.UTF8.GetBytes("{\"error\":\"not found\"}"));
    public static readonly ArraySegment<byte> CODE_FILE_NOT_FOUND         = new ArraySegment<byte>(Encoding.UTF8.GetBytes("{\"error\":\"file not found\"}"));
    public static readonly ArraySegment<byte> CODE_NOT_ENOUGH_INFO        = new ArraySegment<byte>(Encoding.UTF8.GetBytes("{\"error\":\"not enough information\"}"));
    public static readonly ArraySegment<byte> CODE_HOST_UNKNOWN           = new ArraySegment<byte>(Encoding.UTF8.GetBytes("{\"error\":\"no such host is known\"}"));
    public static readonly ArraySegment<byte> CODE_HOST_UNREACHABLE       = new ArraySegment<byte>(Encoding.UTF8.GetBytes("{\"error\":\"host is unreachable\"}"));
    public static readonly ArraySegment<byte> CODE_TCP_CONN_FAILURE       = new ArraySegment<byte>(Encoding.UTF8.GetBytes("{\"error\":\"tcp connection failure\"}"));
    public static readonly ArraySegment<byte> CODE_OTHER_TASK_IN_PROGRESS = new ArraySegment<byte>(Encoding.UTF8.GetBytes("{\"error\":\"another task is already in progress\"}"));
    public static readonly ArraySegment<byte> CODE_TASK_DONT_EXITSTS      = new ArraySegment<byte>(Encoding.UTF8.GetBytes("{\"error\":\"this task no longer exists\"}"));


    public static readonly string DIR_ROOT     = Directory.GetCurrentDirectory();
    public static readonly string DIR_KNOWLAGE = $"{DIR_ROOT}{DIRECTORY_SEPARATOR}knowlage";
    public static readonly string DIR_ACL      = $"{DIR_ROOT}{DIRECTORY_SEPARATOR}acl";
    public static readonly string DIR_LOG      = $"{DIR_ROOT}{DIRECTORY_SEPARATOR}log";
    public static readonly string DIR_BACKUP   = $"{DIR_ROOT}{DIRECTORY_SEPARATOR}backup";

    public static readonly string DIR_DATA    = $"{DIR_ROOT}{DIRECTORY_SEPARATOR}data";
    public static readonly string DIR_DEVICES = $"{DIR_DATA}{DIRECTORY_SEPARATOR}devices";
    public static readonly string DIR_USERS   = $"{DIR_DATA}{DIRECTORY_SEPARATOR}users";

    public static readonly string DIR_SCRIPTS       = $"{DIR_DATA}{DIRECTORY_SEPARATOR}scripts";
    public static readonly string DIR_LASTSEEN      = $"{DIR_DATA}{DIRECTORY_SEPARATOR}lastseen";
    public static readonly string DIR_DOCUMENTATION = $"{DIR_DATA}{DIRECTORY_SEPARATOR}documentation";
    public static readonly string DIR_WATCHDOG      = $"{DIR_DATA}{DIRECTORY_SEPARATOR}watchdog";
    public static readonly string DIR_CONFIG        = $"{DIR_DATA}{DIRECTORY_SEPARATOR}configuration";

    public static readonly string FILE_CONFIG = $"{DIR_ROOT}{DIRECTORY_SEPARATOR}protest.cfg";

    public static void InitializeDirectories() {
        DirectoryInfo[] dirs = new DirectoryInfo[] {
            new DirectoryInfo(DIR_LOG),
            new DirectoryInfo(DIR_LASTSEEN),
            new DirectoryInfo(DIR_WATCHDOG),
            new DirectoryInfo(DIR_CONFIG),
            new DirectoryInfo(DIR_ACL),
            new DirectoryInfo(DIR_DATA),
            new DirectoryInfo(DIR_DEVICES),
            new DirectoryInfo(DIR_USERS)
        };

        for (int i = 0; i < dirs.Length; i++)
            try {
                if (!dirs[i].Exists) dirs[i].Create();
            } catch (Exception ex) {
                Logger.Error(ex);
            }
    }

    public static string SizeToString(long size) {
        if (size < 1024) return $"{size} Bytes";
        if (size < Math.Pow(1024, 2)) return $"{Math.Round(size / 1024f)} KB";
        if (size < Math.Pow(1024, 3)) return $"{Math.Round(size / Math.Pow(1024, 2))} MB";
        if (size < Math.Pow(1024, 4)) return $"{Math.Round(size / Math.Pow(1024, 3))} GB";
        if (size < Math.Pow(1024, 5)) return $"{Math.Round(size / Math.Pow(1024, 4))} TB";
        if (size < Math.Pow(1024, 6)) return $"{Math.Round(size / Math.Pow(1024, 5))} EB"; //Exabyte
        if (size < Math.Pow(1024, 7)) return $"{Math.Round(size / Math.Pow(1024, 6))} ZB"; //Zettabyte
        if (size < Math.Pow(1024, 8)) return $"{Math.Round(size / Math.Pow(1024, 7))} YB"; //Yottabyte
        if (size < Math.Pow(1024, 9)) return $"{Math.Round(size / Math.Pow(1024, 8))} BB"; //Brontobyte
        return size.ToString();
    }

    /*private const long UNIX_BASE_TICKS = 621355968000000000L; //January 1, 1970
    public static long DateTimeToUnixTicks(DateTime date) {
        return DateTimeToUnixTicks(date.Ticks);
    }
    public static long DateTimeToUnixTicks(long ticks) {
        long unixTimestamp = ticks - UNIX_BASE_TICKS - TimeZoneInfo.Local.GetUtcOffset(DateTime.UtcNow).Ticks;
        unixTimestamp /= 10_000;
        return unixTimestamp;
    }*/

    public static byte[] VersionToJson() {
        Version ver = Assembly.GetExecutingAssembly().GetName().Version;
        StringBuilder result = new StringBuilder();

        result.Append('{');
        result.Append($"\"name\":\"{Assembly.GetExecutingAssembly().GetName().Name}\",");
        result.Append($"\"string\":\"{ver}\",");
        result.Append($"\"major\":{ver?.Major ?? 0},");
        result.Append($"\"minor\":{ver?.Minor ?? 0},");
        result.Append($"\"build\":{ver?.Build ?? 0},");
        result.Append($"\"revision\":{ver?.Revision ?? 0}");
        result.Append('}');

        return Encoding.UTF8.GetBytes(result.ToString());
    }

    public static string VersionToString() {
        Version ver = Assembly.GetExecutingAssembly().GetName()?.Version;
        return $"{ver?.Major ?? 0}.{ver?.Minor ?? 0}.{ver?.Build ?? 0}.{ver?.Revision ?? 0}";
    }

}