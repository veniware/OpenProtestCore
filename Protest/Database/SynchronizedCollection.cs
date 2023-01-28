

using System.Diagnostics;

namespace System.Collections.Generic;

/// <summary>
/// A thread-safe wrapper around the System.Collections.Generic.Dictionary class.
/// </summary>

public sealed class SynchronizedDictionary<TKey, TValue> : Dictionary<TKey, TValue> where TKey : notnull {

    private readonly object syncRoot = new object();
    public SynchronizedDictionary() { }
    public SynchronizedDictionary(IDictionary<TKey, TValue> dictionary) : base(dictionary) { }
    public SynchronizedDictionary(IEqualityComparer<TKey> comparer) : base(comparer) { }
    public SynchronizedDictionary(int capacity) : base(capacity) { }
    public SynchronizedDictionary(IDictionary<TKey, TValue> dictionary, IEqualityComparer<TKey> comparer) : base(dictionary, comparer) { }
    public SynchronizedDictionary(int capacity, IEqualityComparer<TKey> comparer) : base(capacity, comparer) { }

    public new TValue this[TKey key] {
        get {
            lock (syncRoot)
                return base[key];
        }
        set {
            lock (syncRoot)
                base[key] = value;
        }
    }

    public void Add(KeyValuePair<TKey, TValue> pair) {
        lock (syncRoot) 
            base.Add(pair.Key, pair.Value);        
    }

    public new void Add(TKey key, TValue value) {
        lock (syncRoot)
            base.Add(key, value);
    }
    
    public new void Clear() {
        lock (syncRoot)
            base.Clear();
    }

    public new bool ContainsKey(TKey key) {
        lock (syncRoot) 
            return base.ContainsKey(key);
    }

    public new bool Remove(TKey key) {
        lock (syncRoot)
            return base.Remove(key);
    }

    public new bool TryAdd(TKey key, TValue value) {
        lock (syncRoot)
            return base.TryAdd(key, value);
    }

    public new bool TryGetValue(TKey key, out TValue value) {
        lock (syncRoot)
            return base.TryGetValue(key, out value);
    }

}
