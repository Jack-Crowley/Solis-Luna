// let h6Element = document.querySelector('.text h6')
// let text = h6Element.textContent;
// let lines = text.split('\n');
let f = document.querySelector('.file');

let blogID = document.querySelector(".blogID").textContent

let title = document.querySelector(".title")
let description = document.querySelector(".desc")
let author = document.querySelector(".auth")
let content = document.querySelector(".content")


let done = document.querySelector(".submitEdit")

// h6Element.innerHTML = '';

// lines.forEach((line, index) => {
//   h6Element.innerHTML += line;
//   if (index < lines.length - 1) {
//     h6Element.innerHTML += '<br>';
//   }
// });

done.addEventListener('click', () => {
  const XHR = new XMLHttpRequest();

  XHR.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      location.href = "/admin/blogs"
    }
    else {
      console.log(this)
    }
  };

  XHR.open("POST", "/admin/blogs/edit/" + blogID);

  let formData = new FormData()

  XHR.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

  formData.append("authToken", document.cookie.split('; ').find(cookie => cookie.startsWith("__session="))?.split('=')[1])
  formData.append("title", title.value)
  formData.append("author", author.value)
  formData.append("description", description.value)
  formData.append("content", content.textContent)

  const encodedData = new URLSearchParams(formData).toString();
  XHR.send(encodedData);
})

f.addEventListener('change', function () {
  let file = f.files[0]

  const XHR = new XMLHttpRequest();

  XHR.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      location.reload()
    }
  };

  XHR.open("POST", "/admin/blogs/edit/photo/" + blogID);

  let formData = new FormData()

  XHR.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

  const reader = new FileReader();

  formData.append("authToken", document.cookie.split('; ').find(cookie => cookie.startsWith("__session="))?.split('=')[1])

  reader.onload = (event) => {
    const imageData = event.target.result;
    const base64ImageData = imageData.split(',')[1]
    formData.append("file", base64ImageData)
    formData.append("name", file.name)

    const encodedData = new URLSearchParams(formData).toString();
    XHR.send(encodedData);
  };

  if (file) {
    reader.readAsDataURL(file);
  }
});