let t = document.querySelector('.title')
let d = document.querySelector('.description')
let a = document.querySelector('.author')
let c = document.querySelector(".content")

document.querySelector(".submit").addEventListener('click', () => {
    let title = t.value;
    let description = d.value;
    let author = a.value;
    let content = c.value;

    if (title == "") {
        return
    }
    if (description == "") {
        return
    }
    if (author == "") {
        return
    }
    if (content == "") {
        return
    }

    const XHR = new XMLHttpRequest();

    const data = [["title",title],["description",description],["author",author],
    ["content",content],["authToken",document.cookie.split('; ').find(cookie => cookie.startsWith("__session="))?.split('=')[1]]]

    const dataPairs = []

    data.forEach((item) => {
        dataPairs.push(
            `${encodeURIComponent(item[0])}=${encodeURIComponent(item[1])}`,
        );
    })

    const urlEncodedData = dataPairs.join("&").replace(/%20/g, "+");

    XHR.open("POST", window.location.href);

    XHR.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

    XHR.send(urlEncodedData);

    XHR.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            window.location.href = "/admin/blogs/edit/"+JSON.parse(this.responseText)["blogID"];
        }
    };

})