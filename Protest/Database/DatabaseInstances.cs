namespace Protest;

internal static class DatabaseInstances {
    internal static Database devices;
    internal static Database users;

    internal static void Initialize() {
        devices = new Database("devices", Strings.DIR_DEVICES);
        users = new Database("users", Strings.DIR_USERS);
    }
}
