using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Protest;

internal static class DatabaseInstanses {
    internal static Database devices;
    internal static Database users;

    internal static void Initialize() {
        devices = new Database("devices", Strings.DIR_DEVICES);
        users = new Database("users", Strings.DIR_USERS);
    }
}
