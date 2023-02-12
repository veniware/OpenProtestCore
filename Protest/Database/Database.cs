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
        ignore = 0,
        createnew = 1,
        overwrite = 2,
        append = 3,
        merge = 4
    }

    [Serializable]
    public record Attribute {
        //public string name;
        public string value;
        public string initiator;
        public long date;
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
        return (DateTime.Now.Ticks + offset).ToString("x");
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
            version = DateTime.Now.Ticks;
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

    private bool Write(Entry entry) {
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
                File.WriteAllBytes($"{location}{Strings.DIRECTORY_SEPARATOR}{entry.filename}", cipher);
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

        Logger.Action(initiator, $"Delete equip: {filename}");

        return true;
    }

    public bool Delete(Entry entry, string initiator) {
        return Delete(entry.filename, initiator);
    }

    public bool Save(string filename, SynchronizedDictionary<string, Attribute> modifications, SaveMethod method, string initiator) {
        if (filename is null || filename.Length == 0) {
            filename = GenerateFilename();
        }

        bool exist = dictionary.ContainsKey(filename);

        if (!exist) { //if don't exists, add to db
            return SaveNew(filename, modifications, initiator);
        }

        switch (method) { //if exists
        case SaveMethod.ignore:
            return true;

        case SaveMethod.createnew: //keep the old file, create new
            return SaveNew(filename, modifications, initiator);

        case SaveMethod.overwrite:
            return SaveOverwrite(filename, modifications, initiator);

        case SaveMethod.append:  //append new attributes
            return SaveAppend(filename, modifications, initiator);

        case SaveMethod.merge:  //merged all attributes
            return SaveMerge(filename, modifications, initiator);

        default:
            break;
        }

        return false;
    }

    private bool SaveNew(string filename, SynchronizedDictionary<string, Attribute> modifications, string initiator) {
        Entry newEntry = new Entry() {
            filename = dictionary.ContainsKey(filename) ? GenerateFilename(1) : filename,
            attributes = modifications,
            syncWrite = new object()
        };

        dictionary.TryAdd(filename, newEntry);
        version = DateTime.Now.Ticks;

        //new Thread(() => { Write(newEntry); }).Start();
        Write(newEntry);

        Logger.Action(initiator, $"Create a new entry on {this.name} database: {filename}");
        return true;
    }    
    private bool SaveOverwrite(string filename, SynchronizedDictionary<string, Attribute> modifications, string initiator) {
        dictionary.Remove(filename, out Entry oldEntry);

        Entry newEntry = new Entry() {
            filename = filename,
            attributes = modifications,
            syncWrite = oldEntry.syncWrite
        };

        dictionary.TryAdd(filename, newEntry);
        version = DateTime.Now.Ticks;

        //new Thread(() => { Write(newEntry); }).Start();
        Write(newEntry);

        Logger.Action(initiator, $"Overwrite entry on {this.name} database: {filename}");
        return true;
    }
    private bool SaveAppend(string filename, SynchronizedDictionary<string, Attribute> modifications, string initiator) {
        dictionary.Remove(filename, out Entry oldEntry);

        /*foreach (Attribute newAttr in modifications.Values) {
            if (!oldEntry.attributes.ContainsKey(newAttr.name)) {
                oldEntry.attributes.TryAdd(newAttr.name, newAttr);
            }
        }*/

        foreach (KeyValuePair<string, Attribute> pair in modifications) {
            if (!oldEntry.attributes.ContainsKey(pair.Key)) {
                oldEntry.attributes.TryAdd(pair.Key, pair.Value);
            }
        }

        dictionary.TryAdd(filename, oldEntry);
        version = DateTime.Now.Ticks;

        //new Thread(() => { Write(oldEntry); }).Start();
        Write(oldEntry);

        Logger.Action(initiator, $"Append on entry {this.name} database: {filename}");
        return true;
    }
    private bool SaveMerge(string filename, SynchronizedDictionary<string, Attribute> modifications, string initiator) {
        dictionary.Remove(filename, out Entry oldEntry);

        /*foreach (Attribute oldAttr in oldEntry.attributes.Values) {
            if (!modifications.ContainsKey(oldAttr.name)) {
                modifications.TryAdd(oldAttr.name, oldAttr);
            }
        }*/

        foreach (KeyValuePair<string, Attribute> pair in oldEntry.attributes) {
            if (!modifications.ContainsKey(pair.Key)) {
                modifications.TryAdd(pair.Key, pair.Value);
            }
        }

        oldEntry.attributes = modifications;
        dictionary.TryAdd(filename, oldEntry);
        version = DateTime.Now.Ticks;

        //new Thread(() => { Write(oldEntry); }).Start();
        Write(oldEntry);

        Logger.Action(initiator, $"Marge with entry on {this.name} database: {filename}");
        return true;
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
            if (attr.StartsWith("filename=", StringComparison.OrdinalIgnoreCase))
                filename = attr[9..].ToString();

            startIndex = endIndex + 1;
        }

        filename ??= GenerateFilename(); 


        string payload;
        using (StreamReader reader = new StreamReader(ctx.Request.InputStream, ctx.Request.ContentEncoding))
            payload = reader.ReadToEnd();

        if (payload.Length == 0) return Strings.CODE_INV.Array;

        JsonSerializerOptions options = new JsonSerializerOptions();
        options.Converters.Add(new AttributeListJsonConverter());
        SynchronizedDictionary<string, Attribute> modifications = JsonSerializer.Deserialize<SynchronizedDictionary<string, Attribute>>(payload, options);

        if (Save(filename, modifications, SaveMethod.overwrite, initiator)) {
            return Strings.CODE_OK.Array;
        }

        return Strings.CODE_FAI.Array;
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
        //writer.WriteStartObject();
        writer.WritePropertyName(value.filename);
        attributeListConverter.Write(writer, value.attributes, options);
        //writer.WriteEndObject();
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

                /*if (propertyName == "n") {
                    attr.name = reader.GetString();

                } else*/ if (propertyName == "v") {
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
            //writer.WriteString("n", pair.Value.name);
            writer.WriteString("v", pair.Value.value);
            writer.WriteString("i", pair.Value.initiator);
            writer.WriteNumber("d", pair.Value.date);
            writer.WriteEndObject();
        }

        writer.WriteEndObject();
    }
}
