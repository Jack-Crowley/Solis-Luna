let file = document.querySelector(".file")
let modal = document.querySelector('.backgroundModal')
let uid = document.querySelector(".uid").textContent
let revealButton = document.querySelector(".clickToExpand")
let bioText = document.querySelector('.bioText')

document.querySelector('.modal-submit').addEventListener('click', () => {
    const XHR = new XMLHttpRequest();

    XHR.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            location.reload()
        }
    };

    XHR.open("POST", "/admin/users/edit/"+uid);

    let formData = new FormData()

    formData.append("authToken", document.cookie.split('; ').find(cookie => cookie.startsWith("__session="))?.split('=')[1])

    XHR.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

    const reader = new FileReader();
            
    reader.onload = (event) => {
        const imageData = event.target.result;
        const base64ImageData = imageData.split(',')[1]
        formData.append("file",base64ImageData)
        formData.append("name",file.files[0].name)

        const encodedData = new URLSearchParams(formData).toString();
        XHR.send(encodedData);
    };

    console.log(file.files[0])

    if (file.files[0]) {
        reader.readAsDataURL(file.files[0]);
    }
    else {
        modal.style.display="none"
    }
})

document.querySelector(".img").addEventListener('click', () => {
    modal.style.display="flex"
})

document.querySelector('.clickToExpand').addEventListener('click', () => {
    revealButton.style.display = "none";
    bioText.style.display = "block"
})