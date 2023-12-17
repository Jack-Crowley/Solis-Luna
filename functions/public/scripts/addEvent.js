let n = document.querySelector(".name")
let de = document.querySelector(".description")
let da = document.querySelector(".date")

let regionTitle = document.querySelector('.region-button')

document.querySelectorAll(".r-subsection > li").forEach((option) => {

    option.addEventListener('click', () => {
        let parentRegion = option.parentElement.parentElement.textContent.trim().split(" »")[0]
        regionTitle.textContent = parentRegion+": "+option.textContent.trim();
        console.log(regionTitle.textContent)
    })
})

document.querySelectorAll(".region-options > li").forEach((option) => {
    if (option.children.length == 1) return;

    option.addEventListener('click', () => {
        regionTitle.textContent = option.textContent.split(" »")[0];
    })
})

document.querySelector(".submit").addEventListener('click', () => {
    let name = n.value;
    let description = de.value;
    let date = da.value;
    let region = regionTitle.textContent;

    if (name == "") return
    if (description == "") return
    if (date == "") return
    if (region == "") return

    const XHR = new XMLHttpRequest();

    const dataPairs = [];

    const data = [["name",name],["description",description],["date",date],
    ["region",region],["authToken",document.cookie.split('; ').find(cookie => cookie.startsWith("__session="))?.split('=')[1]]]

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
            window.location.href = "/admin/events/edit/"+JSON.parse(this.responseText)["eventID"];
        }
    };

})