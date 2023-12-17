let search = document.querySelector(".searchInput")
let blogs = document.querySelector('.blogs')

document.querySelectorAll('.singleBlog').forEach((blog) => {
    blog.addEventListener('click', () => {
        window.location.href = "/blog/"+blog.dataset.blogid
    })
})

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
        name: search.value
    }

    let options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };

    fetch('/blog/search', options)
        .then(response => response.json())
        .then(data => {
            document.querySelectorAll(".singleBlog").forEach((blog) => {
                blog.remove()
            })

            console.log(data)

            data.forEach((blog) => {

                let div = document.createElement('div')
                div.classList.add("singleBlog")
                div.dataset.blogid = blog.blogID
                div.addEventListener('click', (e) => {
                    window.location.href = "/blog/"+e.target.dataset.blogid
                })

                let img = document.createElement('img')
                img.src = blog.picture

                div.append(img)

                let infoDiv = document.createElement("div")
                infoDiv.classList.add("information")

                let title = document.createElement('h2')
                title.textContent = blog.title

                let author = document.createElement('h4')
                author.textContent = blog.author

                let date = document.createElement('h5')
                date.textContent = getFormattedDate(new Date((blog.date["_seconds"] * 1000)+ (blog.date["_nanoseconds"] / 1000000)))

                let description = document.createElement('h6')
                description.textContent = blog.description

                infoDiv.appendChild(title)
                infoDiv.appendChild(author)
                infoDiv.appendChild(date)
                infoDiv.appendChild(description)

                div.append(infoDiv)

                blogs.append(div)
            })
        })
        .catch(error => {
            console.error('Error:', error);
        });

    console.log(options)
})