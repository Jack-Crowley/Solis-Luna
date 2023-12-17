document.querySelectorAll(".edit").forEach((edit) => {
    edit.addEventListener('click', () => [
        window.location.href = "/admin/events/edit/"+edit.dataset.eventid
    ])
})

document.querySelectorAll(".delete").forEach((edit) => {
    edit.addEventListener('click', () => [
        window.location.href = "/admin/events/delete/"+edit.dataset.eventid
    ])
})

let regionTitle = document.querySelector('.regionDropDownTitle')

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

let search = document.querySelector(".searchInput")
let table = document.querySelector("table")

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

document.querySelector(".searchIcons").addEventListener('click', () => {
    let data = {
        region: regionTitle.textContent.trim(),
        name: search.value,
        authToken: document.cookie.split('; ').find(cookie => cookie.startsWith("__session="))?.split('=')[1],
    }

    let options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };

    fetch('/admin/events/search', options)
        .then(response => response.json())
        .then(data => {
            document.querySelectorAll(".event").forEach((user) => {
                user.remove()
            })

            console.log(data)

            data.forEach((event) => {

                let tr = document.createElement('tr')
                tr.classList.add("event")

                let name = document.createElement('td')
                name.textContent = event.name

                let region = document.createElement('td')
                region.textContent = event.region

                let date = document.createElement('td')
                date.textContent = getFormattedDate(new Date((event.date["_seconds"] * 1000)+ (event.date["_nanoseconds"] / 1000000)))

                let edit = document.createElement('td')
                edit.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="1.5em" data-eventid="`+event.eventID+`" viewBox="0 0 512 512" class="edit"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0 152V424c0 48.6 39.4 88 88 88H360c48.6 0 88-39.4 88-88V312c0-13.3-10.7-24-24-24s-24 10.7-24 24V424c0 22.1-17.9 40-40 40H88c-22.1 0-40-17.9-40-40V152c0-22.1 17.9-40 40-40H200c13.3 0 24-10.7 24-24s-10.7-24-24-24H88z"/></svg>`

                let dele = document.createElement('td')
                dele.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="1.5em" data-eventid="`+event.eventID+`" viewBox="0 0 448 512" class="delete"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>`

                edit.addEventListener('click', (e) => {
                    window.location.href = "/admin/events/edit/"+e.target.dataset.eventid
                })
            
                dele.addEventListener('click', (e) => {
                    window.location.href = "/admin/events/delete/"+e.target.dataset.eventid
                })

                tr.appendChild(name)
                tr.appendChild(region)
                tr.appendChild(date)
                tr.appendChild(edit)
                tr.appendChild(dele)

                table.append(tr)
            })
        })
        .catch(error => {
            console.error('Error:', error);
        });

    console.log(options)
})