/*
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.

    Pro-test
    Copyright (C) 2023 veniware
    For more information, visit https://github.com/veniware/OpenProtest
*/

global using System;
global using System.Linq;

namespace Protest;

internal class Program {

    static void Main(string[] args) {
        Console.Title = "Pro-test";

        Console.WriteLine(@"   _____");
        Console.WriteLine(@"  |  __ \            _            _");
        Console.WriteLine(@"  | |_/ / __ ___ ___| |_ ___  ___| |_");
        Console.WriteLine(@"  |  __/ '__/ _ \___| __/ _ \/ __| __|");
        Console.WriteLine(@"  | |  | | | (_) |  | ||  __/\__ \ |_");
        Console.WriteLine(@"  \_|  |_|  \___/   \__ \___||___/\__|");
        Console.WriteLine($"{Strings.VersionToString(), 38}");
        Console.WriteLine();

#if DEBUG
        Console.WriteLine(" - Debug mode");
        Console.WriteLine($" - Startup path: {Environment.CommandLine}");
#endif
        Console.WriteLine($" - Start time: {DateTime.Now.ToString(Strings.DATETIME_FORMAT)}");
        Console.WriteLine($" - GUID: {Strings.GUID}");
        Console.WriteLine();

#if OS_WINDOWS
        if (Configuration.force_registry_keys && OperatingSystem.IsWindows()) {
            bool disableHeader = Configuration.DisableServerHeaderRegKey();
            Console.WriteLine(string.Format("{0, -23} {1, -10}", "Force registry keys", disableHeader ? "OK  " : "Failed"));
        }
#endif

        Strings.InitializeDirectories();

        bool loadConfig = Configuration.Load();
        Console.WriteLine(string.Format("{0, -23} {1, -10}", "Loading configuration", loadConfig ? "OK  " : "Failed"));
        if (!loadConfig) {
            Console.WriteLine("Creating default configuration file");
            Configuration.CreateDefault();
        }

        DatabaseInstances.Initialize();

        bool loadAcl = Http.Auth.LoadAcl();
        Console.WriteLine(string.Format("{0, -23} {1, -10}", "Loading ACL", loadAcl ? "OK  " : "Failed"));

        Http.Listener listener = new Http.Listener(Configuration.http_prefixes, Configuration.front_path);
        Console.WriteLine(listener.ToString());
        listener.Start();
    }
}