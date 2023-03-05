﻿#if NET7_0_OR_GREATER
//#define DEFLATE
#define BROTLI
#endif

//#define SVG_TO_SVGZ
#define SVG_TO_LIGHT

using System.IO;
using System.IO.Compression;
using System.Collections.Generic;
using System.Text;

namespace Protest.Http;

internal sealed class Cache {
    public struct Entry {
        public byte[] bytes;
        public byte[] gzip;
#if DEFLATE
        public byte[] deflate;
#endif
#if BROTLI
        public byte[] brotli;
#endif
        public string contentType;
        public KeyValuePair<string, string>[] headers;
    }

    //public const uint CACHE_CONTROL_MAX_AGE = 86_400; //24h
    public const uint CACHE_CONTROL_MAX_AGE = 15_768_000; //6m

    private readonly static Dictionary<string, string> CONTENT_TYPE = new Dictionary<string, string>() {
        {"htm",  "text/html; charset=utf-8"},
        {"html", "text/html; charset=utf-8"},
        {"css",  "text/css; charset=utf-8"},
        
        {"txt",  "text/plain; charset=utf-8"},
        {"text", "text/plain; charset=utf-8"},
        {"log",  "text/plain; charset=utf-8"},
        {"csv",   "text/csv; charset=utf-8"},
        {"xml",   "text/xml; charset=utf-8"},
        {"vcf",   "text/vcard; charset=utf-8"},
        {"vcard", "text/vcard; charset=utf-8"},

        {"ico",  "image/x-icon"},
        {"png",  "image/png"},
        {"jpg",  "image/jpeg"},
        {"jpe",  "image/jpeg"},
        {"jpeg", "image/jpeg"},
        {"webp", "image/webp"},
        {"svg",  "image/svg+xml; charset=utf-8"},
        {"svgz", "image/svg+xml; charset=utf-8"},

        {"otf",  "font/otf"},
        {"ttf",  "font/ttf"},

        {"js",   "application/javascript; charset=utf-8"},
        {"json", "application/json; charset=utf-8"},
        {"zip",  "application"}
    };

    private string birthdate;
    private readonly string path;

    public readonly Dictionary<string, Entry> cache = new Dictionary<string, Entry>();

    public Cache(string path) {
        birthdate = DateTime.UtcNow.ToString(Strings.DATETIME_FORMAT);
        this.path = path;
        Load();
    }

    public void Reload() {
        cache.Clear();
        Load();
    }

    private bool Load() {
        birthdate = DateTime.UtcNow.ToString(Strings.DATETIME_FORMAT);

#if DEBUG
        long _raw = 0, _brotli = 0, _deflate = 0, _gzip = 0;
#endif

        DirectoryInfo dir = new DirectoryInfo(path);
        if (!dir.Exists) return false;

        Dictionary<string, byte[]> files = new Dictionary<string, byte[]>();
#if SVG_TO_SVGZ //svgz
        Dictionary<string, byte[]> toSvg = new Dictionary<string, byte[]>();
#endif

        foreach (FileInfo f in dir.GetFiles())
            LoadFile(f, ref files);

        foreach (DirectoryInfo d in dir.GetDirectories())
            foreach (FileInfo f in d.GetFiles())
                LoadFile(f, ref files);

        foreach (KeyValuePair<string, byte[]> pair in files) {
            if (pair.Value is null) continue;

            string name = pair.Key.ToLower();
            name = name.Replace("\\", "/");
            name = name.Replace(".html", String.Empty).Replace(".htm", String.Empty);
            if (name == "/index") name = "/";

            byte[] bytes = pair.Value;
            Entry entry = ConstructEntry(name, bytes);
            cache.Add(name, entry);

#if DEBUG
            _raw += bytes.LongLength;
            _gzip += entry.gzip.LongLength;
#if DEFLATE
            _deflate += entry.deflate.LongLength;
#endif
#if BROTLI
            _brotli += entry.brotli.LongLength;
#endif
#endif

#if SVG_TO_SVGZ //svgz
            if (name.EndsWith(".svg") && !files.ContainsKey($"{o.Key}z"))
                toSvg.Add($"{name}z", entry.gzip);
#endif

#if SVG_TO_LIGHT
            if (name.StartsWith("/mono/") && name.EndsWith(".svg")) {
                string content = Encoding.UTF8.GetString(bytes);

                if (content.IndexOf("\"#202020\"") > -1) {
                    content = content.Replace("\"#202020\"", "\"#c0c0c0\"");
                    byte[] lightBytes = Encoding.UTF8.GetBytes(content);
                    string lightName = $"{name}?light";
                    Entry lightEntry = ConstructEntry(lightName, lightBytes, "svg");
                    cache.Add(lightName, lightEntry);
#if SVG_TO_SVGZ //svgz
                    if (!files.ContainsKey($"{name}z?light"))
                        toSvg.Add($"{name}z?light", lightEntry.gzip);
#endif
                }
            }
#endif
        }

#if SVG_TO_SVGZ //svgz
        foreach (KeyValuePair<string, byte[]> pair in toSvg) {
            string name = pair.Key;
            name = name.Replace(path, String.Empty);
            name = name.Replace("\\", "/");

            Entry entry = new Entry() {
                bytes = pair.Value,
                contentType = "image/svg+xml; charset=utf-8",
                headers = new KeyValuePair<string, string>[] { new KeyValuePair<string, string>("Content-Encoding", "gzip") },
            };

            cache.Add(name, entry);
        }
#endif

#if DEBUG
        Console.WriteLine("Front end cache:");

        if (_gzip > 0)
            Console.WriteLine($" GZip    : {100 * _gzip / (_raw + 1),5}% {_raw,10} -> {_gzip,8}");

        if (_deflate > 0)
            Console.WriteLine($" Deflate : {100 * _deflate / (_raw + 1),5}% {_raw,10} -> {_deflate,8}");

        if (_brotli > 0)
            Console.WriteLine($" Brotli  : {100 * _brotli / (_raw + 1),5}% {_raw,10} -> {_brotli,8}");

/*      long memory = 0;
        foreach (KeyValuePair<string, Entry> pair in cache) {
            memory += pair.Value.bytes?.Length ?? 0;
            memory += pair.Value.gzip?.Length ?? 0;
#if DEFLATE
            memory += pair.Value.deflate?.Length ?? 0;
#endif
#if BROTLI
            memory += pair.Value.brotli?.Length ?? 0;
#endif
        }
        Console.WriteLine($" Size in memory: {memory}");*/

        Console.WriteLine();
#endif

            GC.Collect();
        return true;
    }

    private void LoadFile(FileInfo f, ref Dictionary<string, byte[]> files) {
        string name = f.FullName;
        name = name.Replace(path, String.Empty);
        name = name.Replace("\\", "/");

        using FileStream fs = new FileStream(f.FullName, FileMode.Open, FileAccess.Read);
        using BinaryReader br = new BinaryReader(fs);

        byte[] bytes = br.ReadBytes((int)f.Length);
        files.Add(name, bytes);
    }

    private Entry ConstructEntry(string name, byte[] bytes, string extension = null) {
        extension ??= name.Split('.').Last();

        byte[] gzip = GZip(bytes);
#if DEFLATE
            byte[] deflate = Deflate(bytes);
#endif
#if BROTLI
        byte[] brotli = Brotli(bytes);
#endif
        List<KeyValuePair<string, string>> headers = new List<KeyValuePair<string, string>>();
        if (name.EndsWith(".js")) {
            headers.Add(new KeyValuePair<string, string>("X-Content-Type-Options", "nosniff"));
        }

        headers.Add(new KeyValuePair<string, string>("Last-Modified", birthdate));
        headers.Add(new KeyValuePair<string, string>("Referrer-Policy", "no-referrer"));

#if DEBUG
        headers.Add(new KeyValuePair<string, string>("Cache-Control", "no-store"));
#else
        headers.Add(new KeyValuePair<string, string>("Cache-Control", name == "//" ? "no-store" : $"max-age={CACHE_CONTROL_MAX_AGE}"));
#endif

        Entry entry = new Entry() {
            bytes = bytes,
            gzip = gzip,
#if DEFLATE
            deflate = deflate,
#endif
#if BROTLI
            brotli = brotli,
#endif
            contentType = CONTENT_TYPE.TryGetValue(extension, out string value) ? value : "text/html; charset=utf-8",
            headers = headers.ToArray()
        };

        return entry;
    }

    public static byte[] Minify(byte[] bytes) {

        return null;
    }

    public static byte[] GZip(byte[] bytes) {
        if (bytes is null) return Array.Empty<byte>();

        MemoryStream ms = new MemoryStream();
        using (GZipStream zip = new GZipStream(ms, CompressionMode.Compress, true)) {
            zip.Write(bytes, 0, bytes.Length);
        }

        byte[] arary = ms.ToArray();
        ms.Dispose();

        return arary;
    }
    public static byte[] UnGZip(byte[] bytes) {
        if (bytes is null) return Array.Empty<byte>();

        using MemoryStream zipped = new MemoryStream(bytes);
        using GZipStream unzip = new GZipStream(zipped, CompressionMode.Decompress);
        using MemoryStream ms = new MemoryStream();
        unzip.CopyTo(ms);
        return ms.ToArray();
    }

#if DEFLATE
    public static byte[] Deflate(byte[] bytes) {
        if (bytes is null) return Array.Empty<byte>();

        byte[] output;
        using MemoryStream msInput = new MemoryStream(bytes);
        using MemoryStream ms = new MemoryStream();
        using DeflateStream bs = new DeflateStream(ms, CompressionMode.Compress);
        msInput.CopyTo(bs);
        bs.Close();
        output = ms.ToArray();
        return output;
    }
    public static byte[] UnDeflate(byte[] bytes) {
        if (bytes is null) return Array.Empty<byte>();

        byte[] output;
        using MemoryStream msInput = new MemoryStream(bytes);
        using DeflateStream bs = new DeflateStream(msInput, CompressionMode.Decompress);
        using MemoryStream ms = new MemoryStream();
        bs.CopyTo(ms);
        ms.Seek(0, SeekOrigin.Begin);
        output = ms.ToArray();
        return output;
    }
#endif

#if BROTLI
    public static byte[] Brotli(byte[] bytes) {
        if (bytes is null) return Array.Empty<byte>();

        byte[] output;
        using MemoryStream msInput = new MemoryStream(bytes);
        using MemoryStream ms = new MemoryStream();
        using BrotliStream bs = new BrotliStream(ms, CompressionMode.Compress);
        msInput.CopyTo(bs);
        bs.Close();
        output = ms.ToArray();
        return output;
    }
    public static byte[] UnBrotli(byte[] bytes) {
        if (bytes is null) return Array.Empty<byte>();

        byte[] output;
        using MemoryStream msInput = new MemoryStream(bytes);
        using BrotliStream bs = new BrotliStream(msInput, CompressionMode.Decompress);
        using MemoryStream ms = new MemoryStream();
        bs.CopyTo(ms);
        ms.Seek(0, SeekOrigin.Begin);
        output = ms.ToArray();
        return output;
    }
#endif

}