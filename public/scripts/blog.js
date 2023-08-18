let regionTitle = document.querySelector('.regionDropDownTitle')

document.querySelectorAll(".blog-subsection > li").forEach((option) => {

    option.addEventListener('click', () => {
        regionTitle.textContent = option.textContent;
    })
})

document.querySelectorAll(".blog-selector > li").forEach((option) => {
    if (option.children.length == 1) return;

    option.addEventListener('click', () => {
        regionTitle.textContent = option.textContent.split(" »")[0];
    })
})

document.querySelectorAll('.singleBlog').forEach((blog) => {
    blog.addEventListener('click', () => {
        window.location.href = "/blog/a"
    })
})