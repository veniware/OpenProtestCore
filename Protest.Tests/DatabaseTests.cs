global using NUnit.Framework;

namespace Protest.Tests;

public class DatabaseTests {

    private string johnFilename;
    private string noahFilename;
    private string lilyFilename;

    private readonly DirectoryInfo directory = new DirectoryInfo($"{Strings.DIR_DATA}{Strings.DIRECTORY_SEPARATOR}database_test");
    private readonly string initiator = "unit test";

    public DatabaseTests() {
        johnFilename = String.Empty;
        noahFilename = String.Empty;
        lilyFilename = String.Empty;

        if (!directory.Exists) directory.Create();
    }

    [SetUp]
    public void Setup() { }

    [Test, Order(1)]
    public void Database1_Create() {
        Database database = new Database("test", directory.FullName);

        Database.Entry john = new Database.Entry {
            filename = Database.GenerateFilename(),
            syncWrite = new object(),
            attributes = new SynchronizedDictionary<string, Database.Attribute>()
        };
        john.attributes.Add("firstname", new Database.Attribute() {
            //name = "firstname",
            value = "John",
            date = DateTime.Now.Ticks,
            initiator = initiator
        });
        john.attributes.Add("lastname", new Database.Attribute() {
            //name = "lastname",
            value = "Smith",
            date = DateTime.Now.Ticks,
            initiator = initiator
        });
        john.attributes.Add("title", new Database.Attribute() {
            //name = "title",
            value = "CEO",
            date = DateTime.Now.Ticks,
            initiator = initiator
        });

        Database.Entry noah = new Database.Entry {
            filename = Database.GenerateFilename(),
            syncWrite = new object(),
            attributes = new SynchronizedDictionary<string, Database.Attribute>()
        };
        noah.attributes.Add("firstname", new Database.Attribute() {
            //name = "firstname",
            value = "Noah",
            date = DateTime.Now.Ticks,
            initiator = initiator
        });
        noah.attributes.Add("lastname", new Database.Attribute() {
            //name = "lastname",
            value = "Williams",
            date = DateTime.Now.Ticks,
            initiator = initiator
        });
        noah.attributes.Add("title", new Database.Attribute() {
            //name = "title",
            value = "CFO",
            date = DateTime.Now.Ticks,
            initiator = initiator
        });

        bool a = database.Save(john.filename, john.attributes, Database.SaveMethod.createnew, initiator);
        if (!a) Assert.Fail("Failed to save John");

        bool b = database.Save(noah.filename, noah.attributes, Database.SaveMethod.createnew, initiator);
        if (!b) Assert.Fail("Failed to save Noah");

        johnFilename = john.filename;
        noahFilename = noah.filename;

        john = database.GetEntry(johnFilename);
        Assert.That(john, Is.Not.Null);
        noah = database.GetEntry(noahFilename);
        Assert.That(noah, Is.Not.Null);

        Assert.Multiple(() => {
            Assert.That(john.attributes["firstname"].value, Is.EqualTo("John"));
            Assert.That(john.attributes["lastname"].value, Is.EqualTo("Smith"));
            Assert.That(john.attributes["title"].value, Is.EqualTo("CEO"));

            Assert.That(noah.attributes["firstname"].value, Is.EqualTo("Noah"));
            Assert.That(noah.attributes["lastname"].value, Is.EqualTo("Williams"));
            Assert.That(noah.attributes["title"].value, Is.EqualTo("CFO"));
        });

        Assert.Pass();
    }

    [Test, Order(2)]
    public void Database2_Overwrite() {
        Database database = new Database("test", directory.FullName);

        Database.Entry newCfo = new Database.Entry {
            filename = noahFilename,
            syncWrite = new object(),
            attributes = new SynchronizedDictionary<string, Database.Attribute>()
        };
        newCfo.attributes.Add("firstname", new Database.Attribute() {
            //name = "firstname",
            value = "Lily",
            date = DateTime.Now.Ticks,
            initiator = initiator
        });
        newCfo.attributes.Add("lastname", new Database.Attribute() {
            //name = "lastname",
            value = "Miller",
            date = DateTime.Now.Ticks,
            initiator = initiator
        });
        newCfo.attributes.Add("title", new Database.Attribute() {
            //name = "title",
            value = "CFO",
            date = DateTime.Now.Ticks,
            initiator = initiator
        });

        bool a = database.Save(newCfo.filename, newCfo.attributes, Database.SaveMethod.overwrite, initiator);
        if (!a) Assert.Fail("Failed to save new CFO");


        Database.Entry lily = database.GetEntry(noahFilename);
        Assert.That(lily, Is.Not.Null);
        Assert.Multiple(() => {
            Assert.That(lily.attributes["firstname"].value, Is.EqualTo("Lily"));
            Assert.That(lily.attributes["lastname"].value, Is.EqualTo("Miller"));
            Assert.That(lily.attributes["title"].value, Is.EqualTo("CFO"));
        });
        lilyFilename = lily.filename;

        Assert.Pass();
    }

    [Test, Order(3)]
    public void Database3_Append() {
        Database database = new Database("test", directory.FullName);

        Database.Entry lilyWithEmail = new Database.Entry {
            filename = lilyFilename,
            syncWrite = new object(),
            attributes = new SynchronizedDictionary<string, Database.Attribute>()
        };
        lilyWithEmail.attributes.Add("firstname", new Database.Attribute() {
            //name = "firstname",
            value = "IGNORE",
            date = DateTime.Now.Ticks,
            initiator = initiator
        });
        lilyWithEmail.attributes.Add("email", new Database.Attribute() {
            //name = "email",
            value = "lily@protest.com",
            date = DateTime.Now.Ticks,
            initiator = initiator
        });

        bool a = database.Save(lilyWithEmail.filename, lilyWithEmail.attributes, Database.SaveMethod.append, initiator);
        if (!a) Assert.Fail("Failed to save Lily with e-mail");

        Database.Entry john = database.GetEntry(johnFilename);
        Assert.That(john, Is.Not.Null);

        Database.Entry lily = database.GetEntry(lilyFilename);
        Assert.That(lily, Is.Not.Null);

        Assert.Multiple(() => {
            Assert.That(john.attributes["firstname"].value, Is.EqualTo("John"));
            Assert.That(john.attributes["lastname"].value, Is.EqualTo("Smith"));
            Assert.That(john.attributes["title"].value, Is.EqualTo("CEO"));

            Assert.That(lily.attributes["firstname"].value, Is.EqualTo("Lily"));
            Assert.That(lily.attributes["lastname"].value, Is.EqualTo("Miller"));
            Assert.That(lily.attributes["title"].value, Is.EqualTo("CFO"));
            Assert.That(lily.attributes["email"].value, Is.EqualTo("lily@protest.com"));
        });

        Assert.Pass();
    }

    [Test, Order(4)]
    public void Database4_Merge() {
        Database database = new Database("test", directory.FullName);

        Database.Entry liliGotMarried = new Database.Entry {
            filename = lilyFilename,
            syncWrite = new object(),
            attributes = new SynchronizedDictionary<string, Database.Attribute>()
        };
        liliGotMarried.attributes.Add("lastname", new Database.Attribute() {
            //name = "lastname",
            value = "Rodriguez",
            date = DateTime.Now.Ticks,
            initiator = initiator
        });
        liliGotMarried.attributes.Add("phone", new Database.Attribute() {
            //name = "phone",
            value = "555-12345678",
            date = DateTime.Now.Ticks,
            initiator = initiator
        });

        bool a = database.Save(liliGotMarried.filename, liliGotMarried.attributes, Database.SaveMethod.merge, initiator);
        if (!a) Assert.Fail("Failed to save Lily after getting married");

        Database.Entry john = database.GetEntry(johnFilename);
        Assert.That(john, Is.Not.Null);

        Database.Entry lily = database.GetEntry(lilyFilename);
        Assert.That(lily, Is.Not.Null);

        Assert.Multiple(() => {
            Assert.That(john.attributes["firstname"].value, Is.EqualTo("John"));
            Assert.That(john.attributes["lastname"].value, Is.EqualTo("Smith"));
            Assert.That(john.attributes["title"].value, Is.EqualTo("CEO"));

            Assert.That(lily.attributes["firstname"].value, Is.EqualTo("Lily"));
            Assert.That(lily.attributes["lastname"].value, Is.EqualTo("Rodriguez"));
            Assert.That(lily.attributes["title"].value, Is.EqualTo("CFO"));
            Assert.That(lily.attributes["email"].value, Is.EqualTo("lily@protest.com"));
            Assert.That(lily.attributes["phone"].value, Is.EqualTo("555-12345678"));
        });

        Assert.Pass();
    }

    [Test, Order(5)]
    public void Database5_Reload() {
        Database database = new Database("test", directory.FullName);

        Database.Entry john = database.GetEntry(johnFilename);
        Assert.That(john, Is.Not.Null);

        Database.Entry lily = database.GetEntry(lilyFilename);
        Assert.That(lily, Is.Not.Null);

        Assert.Multiple(() => {
            Assert.That(john.attributes["firstname"].value, Is.EqualTo("John"));
            Assert.That(john.attributes["lastname"].value, Is.EqualTo("Smith"));
            Assert.That(john.attributes["title"].value, Is.EqualTo("CEO"));

            Assert.That(lily.attributes["firstname"].value, Is.EqualTo("Lily"));
            Assert.That(lily.attributes["lastname"].value, Is.EqualTo("Rodriguez"));
            Assert.That(lily.attributes["title"].value, Is.EqualTo("CFO"));
            Assert.That(lily.attributes["email"].value, Is.EqualTo("lily@protest.com"));
            Assert.That(lily.attributes["phone"].value, Is.EqualTo("555-12345678"));
        });

        Assert.Pass();
    }

    [Test, Order(6)]
    public void Database6_Delete() {
        Database database = new Database("test", directory.FullName);

        bool a = database.Delete(johnFilename, initiator);
        if (!a) Assert.Fail("Failed to delete John");

        bool b = database.Delete(lilyFilename, initiator);
        if (!b) Assert.Fail("Failed to delete Lili");

        Assert.Pass();
    }

}