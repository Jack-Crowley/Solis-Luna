const functions = require('firebase-functions');
const express = require("express");
const session = require('express-session');
const bodyParser = require('body-parser')

const db = require('./firebaseLogin');

const admin = require('firebase-admin');
const app = express();
// const port = 3000;
const bucket = admin.storage().bucket();

app.use(bodyParser.urlencoded({ extended: false, limit: '10mb' }));
app.use(bodyParser.json());

app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

app.use(express.static('public'));

app.use(session({
    secret: "d2FkdWpiYXd1amtkbwadawdsmlvMm51b25laXdhdWpuZA",
    resave: false,
    saveUninitialized: true
}));

async function getRegionsId() {
    let collection = await db.collection("regions").get()

    return collection.docs.map(doc => doc.id);
}

function getFormattedId(id) {
    return id.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase()).replace(":", ": ");
}

async function formatRegions() {
    let regions = await getRegionsId()

    let formattedNavBar = []

    let expandedRegions = new Map()

    for (let i = 0; i < regions.length; i++) {

        let id = regions[i]
        let region = await db.collection("regions").doc(id).get()

        let data = region.data()

        if (!id.includes(":")) {
            formattedNavBar.push({ name: getFormattedId(id), expanded: false, id: id })
        }
        else {
            let parentRegion = id.split(":")[0]
            let childRegion = id.split(":")[1]

            if (expandedRegions.has(parentRegion)) {
                expandedRegions.get(parentRegion).append({name: getFormattedId(childRegion), id: childRegion})
            }
            else {
                expandedRegions.set(parentRegion, [{name: getFormattedId(childRegion), id: childRegion}])
            }
        }
    }

    expandedRegions.forEach((v, k) => {
        formattedNavBar.push({ name: getFormattedId(k), expanded: true, regions: v, id: k})
    })

    return formattedNavBar
}

async function searchForSubString(docs, substring, ...fields) {
    let good = []

    let string = substring.toLowerCase()

    docs.forEach(doc => {
        let data = doc.data()
        let done = false;

        fields.forEach((field) => {
            if (done) return;

            if (data[field].toLowerCase().includes(string)) done = true;
        })

        if (done) good.push(doc)
    })
    return good;
}

function getDaySuffix(day) {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}

function getFormattedDate(date) {
    let eventDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    let suffix = getDaySuffix(date.getDate());

    eventDate.replace(/\d{1,2}$/, date.getDate() + suffix);

    return eventDate
}


async function formatEvents(region) {
    let eventIds = await region.collection('events').get()

    let events = []

    eventIds.docs.forEach((event) => {
        let data = event.data()
        let date = new Date(data.date._seconds * 1000)

        events.push({ name: data.name, date: getFormattedDate(date), description: data.description })
    })

    return events
}

function formatRegionName(region) {
    return region.toLowerCase().replace(/ /g, "-");
}

async function formatPersons(region) {
    let personIds = await region.collection('members').get()

    let regionD = []
    let bloggers = []
    let members = []
    let persons = []

    for (let i = 0; i < personIds.docs.length; i++) {
        let person = personIds.docs[i].id;

        let document = await db.collection('users').doc(person).get()

        let data = document.data()

        if (!data.pfpURL) data.pfpURL = "placeholder.png"

        data.picture = await bucket.file("members/" + data.pfpURL).getSignedUrl({
            action: 'read',
            expires: '03-09-2500',
        });

        if (data.position == "Regional Director") {
            regionD.push({ name: data.fullName, bio: data.bio, role: data.position, picture: data.picture })
        }
        else if (data.position == "Blogger") {
            bloggers.push({ name: data.fullName, bio: data.bio, role: data.position, picture: data.picture })
        }
        else if (data.position == "Member") {
            members.push({ name: data.fullName, bio: data.bio, role: data.position, picture: data.picture })
        }

    }

    return [...regionD, ...bloggers, ...members]
}

function firebaseAuthMiddleware(req, res, next) {
    const idToken = req.session.authToken;

    if (idToken == undefined) {
        res.redirect('/login')
        return;
    }

    admin.auth()
        .verifyIdToken(idToken)
        .then(decodedToken => {
            req.user = decodedToken.user;
            next();
        })
        .catch(error => {
            console.log(error)
            res.redirect('/login')
            return;
        });
}

app.get("/", async (req, res) => {
    res.render('index', { regions: await formatRegions() })
});

app.get("/about", async (req, res) => {
    res.render('mission', { regions: await formatRegions() })
});

app.get("/executives", async (req, res) => {
    res.render('executives', { regions: await formatRegions()})
});

app.get("/blog", async (req, res) => {
    let collection = await db.collection("blogs").get()

    let blogs = []

    for (let i = 0; i < collection.docs.length; i++) {
        let doc = collection.docs[i]

        let blog = doc.data()
        blog["blogID"] = doc.id;
        blogs.push(blog)

        blog.date = getFormattedDate(blog.date.toDate())

        if (!blog.picture) blog.picture = "placeholder.png";

        blog.picture = await bucket.file("blogs/" + blog.picture).getSignedUrl({
            action: 'read',
            expires: '03-09-2500',
        });

    }

    res.render('blogs', { regions: await formatRegions(), blogs: blogs })
});

app.post("/blog/search", async (req, res) => {
    let collection = await db.collection("blogs").get()

    let arr = await searchForSubString(collection.docs, req.body.name, "title", "author")

    let matchingBlogs = [];
    for (let i = 0; i < arr.length; i++) {
        let doc = arr[i];
        let blog = doc.data();
        blog.blogID = doc.id;
        matchingBlogs.push(blog);

        blog.date = getFormattedDate(blog.date.toDate())

        if (!blog.picture) blog.picture = "placeholder.png";

        blog.picture = await bucket.file("blogs/" + blog.picture).getSignedUrl({
            action: 'read',
            expires: '03-09-2500',
        });
    }

    res.json(matchingBlogs);
});

app.get("/blog/:id", async (req, res) => {
    let blogID = req.params.id

    let blog = await db.collection("blogs").doc(blogID).get()

    let data = blog.data()

    data.date = getFormattedDate(data.date.toDate())

    if (!data.picture) data.picture = "placeholder.png";

    data.picture = await bucket.file("blogs/" + data.picture).getSignedUrl({
        action: 'read',
        expires: '03-09-2500',
    });

    res.render('blog', { regions: await formatRegions(), blog: data })
});

app.get("/volunteer", async (req, res) => {
    res.render('volunteer', { regions: await formatRegions() })
});

app.get("/contact", async (req, res) => {
    res.render('contact', { regions: await formatRegions() })
});

app.get("/region/:region", async (req, res) => {
    let region = req.params.region

    let regionList = await getRegionsId()

    if (!regionList.includes(region)) {
        res.redirect("/")
    }
    else {
        let regionDB = await db.collection("regions").doc(region);
        let rDB = await regionDB.get();
        let data = await rDB.data();
        let picture = await bucket.file("regions/" + data.picture).getSignedUrl({
            action: 'read',
            expires: '03-09-2500',
        });
        res.render('region', { regions: await formatRegions(), events: await formatEvents(regionDB), persons: await formatPersons(regionDB), name: getFormattedId(region), picture: picture })
    }
})

app.get("/region/:region/:subsection", async (req, res) => {
    let region = `${req.params.region}:${req.params.subsection}`

    let regionList = await getRegionsId()

    if (!regionList.includes(region)) {
        res.redirect("/")
    }
    else {
        let regionDB = await db.collection("regions").doc(region);
        let rDB = await regionDB.get();
        let data = await rDB.data();
        let picture = await bucket.file("regions/" + data.picture).getSignedUrl({
            action: 'read',
            expires: '03-09-2500',
        });
        res.render('region', { regions: await formatRegions(), events: await formatEvents(regionDB), persons: await formatPersons(regionDB), name: getFormattedId(region), picture: picture })
    }
})

app.get("/admin/", firebaseAuthMiddleware, async (req, res) => {
    res.render('admin/index')
});

app.get("/admin/login", async (req, res) => {
    res.render("login")
})

app.get("/admin/signout", async (req, res) => {
    req.session.authToken = undefined
    res.redirect("/admin/login")
})

app.post("/admin/login", async (req, res) => {
    if (req.body.type == "reset") {
        let link = await admin.auth().generatePasswordResetLink(req.body.email)
        res.json({ "link": link })
    }
    else {
        req.session.authToken = req.body.authToken;
        res.json({ "status": "success" })
    }
})

app.get("/admin/users", async (req, res) => {
    let collection = await db.collection("users").get()

    let documents = collection.docs.map(doc => doc.id)

    let users = []

    for (let i = 0; i < documents.length; i++) {
        if (users.length > 15) continue;

        let user = {}

        let doc = await db.collection("users").doc(documents[i]).get()
        let data = doc.data()

        user["name"] = data.fullName;
        user["region"] = data.region
        user["email"] = data.email
        user["position"] = data.position
        user["uid"] = documents[i]
        user["time"] = getFormattedDate(data.created.toDate())

        users.push(user)
    }

    res.render('admin/usersPanel', { users: users })
});

app.post("/admin/users/search", async (req, res) => {
    let region = req.body.region;

    let collection;

    if (region == "All") {
        collection = await db.collection("users").get()
    }
    else {
        collection = await db.collection("users")
            .where("region", "==", region)
            .get()
    }

    let arr = await searchForSubString(collection.docs, req.body.name, "fullName")

    let matchingUsers = [];
    arr.forEach((doc) => {
        let user = doc.data();
        user.uid = doc.id;
        matchingUsers.push(user);
    });

    res.json(matchingUsers);
});

app.post("/admin/events/search", async (req, res) => {
    let region = req.body.region;

    let collection;

    if (region == "All") {
        collection = await db.collection("events").get()
    }
    else {
        collection = await db.collection("events")
            .where("region", "==", region)
            .get()
    }

    let arr = await searchForSubString(collection.docs, req.body.name, "name")

    let matchingUsers = [];
    arr.forEach((doc) => {
        let user = doc.data();
        user.uid = doc.id;
        matchingUsers.push(user);
    });

    res.json(matchingUsers);
});

app.post("/admin/blogs/search", async (req, res) => {
    let collection = await db.collection("blogs").get()

    let arr = await searchForSubString(collection.docs, req.body.name, "title", "author")

    let matchingBlogs = [];
    arr.forEach((doc) => {
        let blog = doc.data();
        blog.blogID = doc.id;
        matchingBlogs.push(blog);
    });

    res.json(matchingBlogs);
});

app.get("/admin/users/add", firebaseAuthMiddleware, async (req, res) => {
    res.render('admin/addUser')
});

app.get("/admin/users/edit/:uid", async (req, res) => {
    try {
        let document = await db.collection("users").doc(req.params.uid).get()

        let data = document.data()

        let dataJSON = {
            firstName: data.firstName,
            lastName: data.lastName,
            position: data.position,
            region: data.region,
            email: data.email,
            bio: data.bio,
            uid: req.params.uid
        }

        if (data.pfpURL) {
            dataJSON["pfpURL"] = await bucket.file("members/" + data.pfpURL).getSignedUrl({
                action: 'read',
                expires: '03-09-2500',
            });
        }
        else {
            dataJSON["pfpURL"] = await bucket.file("members/placeholder.png").getSignedUrl({
                action: 'read',
                expires: '03-09-2500',
            });
        }

        res.render('admin/editUser', { data: dataJSON })
    }
    catch {
        res.redirect("/users")
    }
});

app.post('/admin/users/edit/:uid', async (req, res) => {
    const imageBuffer = Buffer.from(req.body.file, 'base64')
    const imageByteArray = new Uint8Array(imageBuffer);
    const ending = req.body.name.split(".")[req.body.name.split(".").length - 1]
    const url = req.params.uid + "." + ending

    let document = db.collection("users").doc(req.params.uid)

    document.update({ pfpURL: url })

    const file = bucket.file(`members/` + url);

    const options = { resumable: false, metadata: { contentType: "image/" + ending } }

    return file.save(imageByteArray, options).then(a => {
        res.json({ "status": "good" })
    })
        .catch(err => {
            console.log(`Unable to upload image ${err}`)
        })
});

let uuid = require("uuid-v4")

app.post("/admin/users/add", firebaseAuthMiddleware, async (req, res) => {
    let id;

    if (req.body.email) {
        let userRecord = await admin.auth().createUser({ "email": req.body.email, "password": "securepassword" })
        id = userRecord.uid;
    }
    else id = uuid()

    let region = req.body.region;

    if (req.body.region.includes(":")) {
        region = region.split(": ")[0] + ":" + region.split(": ")[1]
    }

    await db.collection("users").doc(id).set({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        fullName: req.body.firstName + " " + req.body.lastName,
        email: req.body.email,
        region: region,
        position: req.body.position,
        bio: req.body.bio,
        isWriting: req.body.writing == "true",
        instruments: req.body.instruments,
        created: admin.firestore.Timestamp.now()
    })

    await db.collection("regions").doc(formatRegionName(region)).collection("members").doc(id).set({
        name: req.body.firstName + " " + req.body.lastName,
        position: req.body.position,
    })

    res.json({ uid: id })
});

app.get("/admin/regions", firebaseAuthMiddleware, async (req, res) => {
    let collections = await db.collection("regions").get()

    let documents = collections.docs.map(doc => doc.id)

    let regions = []

    for (let i = 0; i < documents.length; i++) {
        let doc = await db.collection("regions").doc(documents[i]).get()
        let data = doc.data()

        let members = await db.collection("regions").doc(documents[i]).collection("members").get()
        let memberCount = members.docs.length

        let region = {}

        region["memberCount"] = memberCount
        region["name"] = getFormattedId(documents[i])

        regions.push(region)
    }

    res.render('admin/regionPanel', { regions: regions })
});

app.get("/admin/regions/add", firebaseAuthMiddleware, async (req, res) => {
    res.render('admin/addRegion')
});

app.post("/admin/regions/add", firebaseAuthMiddleware, async (req, res) => {
    let document = db.collection("regions").doc(formatRegionName(req.body.regionName))

    await document.set({})

    res.json({ "status": "successful" })
});

app.get("/admin/users/delete/:uid", firebaseAuthMiddleware, async (req, res) => {
    let document = await db.collection("users").doc(req.params.uid).get()
    let data = document.data()

    if (data.email) {
        await admin.auth().deleteUser(req.params.uid)
    }


    let region = data.region;

    await db.collection("users").doc(req.params.uid).delete()
    await db.collection("regions").doc(formatRegionName(region)).collection("members").doc(req.params.uid).delete()

    res.redirect('/users')
});

app.get("/admin/blogs", firebaseAuthMiddleware, async (req, res) => {
    let collection = await db.collection("blogs").get()

    let documents = collection.docs.map(doc => doc.id)

    let blogs = []

    for (let i = 0; i < documents.length; i++) {
        let blog = {}

        let doc = await db.collection("blogs").doc(documents[i]).get()
        let data = doc.data()

        blog["title"] = data.title;
        blog["author"] = data.author
        blog["blogID"] = documents[i];
        blog["date"] = getFormattedDate(data.date.toDate())

        blogs.push(blog)
    }

    res.render('admin/blogPanel', { blogs: blogs })
});

app.get("/admin/blogs/add", async (req, res) => {
    res.render('admin/addBlog')
});

app.post("/admin/blogs/add", firebaseAuthMiddleware, async (req, res) => {
    let doc = db.collection("blogs").doc()

    await doc.set({
        title: req.body.title,
        description: req.body.description,
        author: req.body.author,
        content: req.body.content,
        date: admin.firestore.Timestamp.now()
    })

    res.json({ "blogID": doc.id })
});

app.get("/admin/blogs/edit/:blogID", firebaseAuthMiddleware, async (req, res) => {
    let document = await db.collection('blogs').doc(req.params.blogID).get()

    let data = document.data()

    let dataJSON = {
        title: data.title,
        author: data.author,
        description: data.description,
        content: data.content,
        blogID: req.params.blogID
    }

    if (data.picture) {
        dataJSON["picture"] = await bucket.file("blogs/" + data.picture).getSignedUrl({
            action: 'read',
            expires: '03-09-2500',
        });
    }
    else {
        dataJSON["picture"] = await bucket.file("blogs/placeholder.png").getSignedUrl({
            action: 'read',
            expires: '03-09-2500',
        });
    }

    res.render('admin/editBlog', { data: dataJSON })
});

app.post('/admin/blogs/edit/:blogID', firebaseAuthMiddleware, async (req, res) => {
    const imageBuffer = Buffer.from(req.body.file, 'base64')
    const imageByteArray = new Uint8Array(imageBuffer);
    const ending = req.body.name.split(".")[req.body.name.split(".").length - 1]
    const url = req.params.blogID + "." + ending

    let document = db.collection("blogs").doc(req.params.blogID)

    document.update({ picture: url })

    const file = bucket.file(`blogs/` + url);

    const options = { resumable: false, metadata: { contentType: "image/" + ending } }

    return file.save(imageByteArray, options).then(a => {
        res.json({ "status": "good" })
    })
        .catch(err => {
            console.log(`Unable to upload image ${err}`)
        })
});

app.get("/admin/blogs/delete/:blogID", firebaseAuthMiddleware, async (req, res) => {
    await admin.auth().deleteUser(req.params.blogID)

    await db.collection("blogs").doc(req.params.blogID).delete()

    res.redirect('/blogs')
});

app.get("/admin/events", async (req, res) => {
    let collection = await db.collection("events").get()

    let documents = collection.docs.map(doc => doc.id)

    let events = []

    for (let i = 0; i < documents.length; i++) {
        let event = {}

        let doc = await db.collection("events").doc(documents[i]).get()
        let data = doc.data()

        event["name"] = data.name;
        event["region"] = data.region
        event["eventID"] = documents[i]
        event["date"] = getFormattedDate(data.date.toDate())

        events.push(event)
    }

    res.render('admin/eventsPanel', { events: events })
});

app.get("/admin/events/add", firebaseAuthMiddleware, async (req, res) => {
    res.render("admin/addEvent.ejs")
});

app.post("/admin/events/add", firebaseAuthMiddleware, async (req, res) => {
    let region = req.body.region;

    if (req.body.region.includes(":")) {
        region = region.split(": ")[0] + ":" + region.split(": ")[1]
    }

    let [month, day, year] = req.body.date.split('/');

    let document = db.collection("events").doc()

    await document.set({
        name: req.body.name,
        description: req.body.description,
        date: admin.firestore.Timestamp.fromDate(new Date(`${year}-${month}-${day}`)),
        region: region,
    })

    await db.collection("regions").doc(formatRegionName(region)).collection("events").doc(document.id).set({
        name: req.body.name,
        description: req.body.description,
        date: admin.firestore.Timestamp.fromDate(new Date(`${year}-${month}-${day}`)),
    })

    res.json({ eventID: document.id })
})

app.get("/admin/events/edit/:eventID", firebaseAuthMiddleware, async (req, res) => {
    let document = await db.collection("events").doc(req.params.eventID).get()

    let data = document.data()

    let dataJSON = {
        name: data.name,
        description: data.description,
        region: data.region,
        date: getFormattedDate(data.date.toDate()),
        eventID: req.params.eventID
    }

    if (data.picture) {
        dataJSON["picture"] = await bucket.file("events/" + data.picture).getSignedUrl({
            action: 'read',
            expires: '03-09-2500',
        });
    }
    else {
        dataJSON["picture"] = await bucket.file("blogs/placeholder.png").getSignedUrl({
            action: 'read',
            expires: '03-09-2500',
        });
    }

    res.render('admin/editEvent', { data: dataJSON })
});

app.post('/admin/events/edit/:eventID', firebaseAuthMiddleware, async (req, res) => {
    const imageBuffer = Buffer.from(req.body.file, 'base64')
    const imageByteArray = new Uint8Array(imageBuffer);
    const ending = req.body.name.split(".")[req.body.name.split(".").length - 1]
    const url = req.params.eventID + "." + ending

    let document = db.collection("events").doc(req.params.eventID)

    document.update({ picture: url })

    const file = bucket.file(`events/` + url);

    const options = { resumable: false, metadata: { contentType: "image/" + ending } }

    return file.save(imageByteArray, options).then(a => {
        res.json({ "status": "good" })
    })
        .catch(err => {
            console.log(`Unable to upload image ${err}`)
        })
});

app.get("/admin/events/delete/:eventID", firebaseAuthMiddleware, async (req, res) => {
    let document = await db.collection("events").doc(req.params.eventID).get()
    let data = document.data()

    let region = data.region;

    await db.collection("events").doc(req.params.eventID).delete()
    await db.collection("regions").doc(formatRegionName(region)).collection("events").doc(req.params.eventID).delete()

    res.redirect('/events')
});

// app.listen(port, () => {
//     console.log(`App server listening on ${port}. (Go to http://localhost:${port})`);
// });

exports.app = functions.https.onRequest(app);