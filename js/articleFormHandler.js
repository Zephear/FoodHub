
export default class articleFormsHandler {
    assignFormAndArticle(formElementId, cssClass2hideElement, articleId, offset, totalCount) {
        this.cssCl2hideElm = cssClass2hideElement;
        const artForm = document.getElementById(formElementId);
        this.formElements = artForm.elements;

        this.formElements.namedItem('btShowFileUpload').onclick = () => this.showFileUpload();
        this.formElements.namedItem('btFileUpload').onclick = () => this.uploadImg();
        this.formElements.namedItem('btCancelFileUpload').onclick = () => this.cancelFileUpload();


        if (articleId >= 0) {
            artForm.onsubmit = (event) => this.processArtEditFrmData(event);
            this.articleId = articleId;
            this.offset = offset;
            this.totalCount = totalCount;
        } else {

        }

    }
    showFileUpload(event) {
        this.formElements.namedItem('fsetFileUpload').classList.remove(this.cssCl2hideElm);
        this.formElements.namedItem('btShowFileUpload').classList.add(this.cssCl2hideElm);
    }

    cancelFileUpload() {
        this.formElements.namedItem('fsetFileUpload').classList.add(this.cssCl2hideElm);
        this.formElements.namedItem('btShowFileUpload').classList.remove(this.cssCl2hideElm);
    }

    uploadImg() {

        const files = this.formElements.namedItem("flElm").files;

        if (files.length > 0) {
            const imgLinkElement = this.formElements.namedItem("imageLink");
            const fieldsetElement = this.formElements.namedItem("fsetFileUpload");
            const btShowFileUploadElement = this.formElements.namedItem("btShowFileUpload");

            let imgData = new FormData();

            imgData.append("file", files[0]);




            const postReqSettings =
            {
                method: 'POST',
                body: imgData
            };

            fetch(`${this.serverUrl}/fileUpload`, postReqSettings)
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`));
                    }
                })
                .then(responseJSON => {
                    imgLinkElement.value = responseJSON.fullFileUrl;
                    btShowFileUploadElement.classList.remove(this.cssCl2hideElm);
                    fieldsetElement.classList.add(this.cssCl2hideElm);
                })
                .catch(error => {
                    window.alert(`Image uploading failed. ${error}.`);
                });
        } else {
            window.alert("Please, choose an image file.");
        }
    }
    processArtEditFrmData(event) {
        event.preventDefault();

        const articleData = {
            title: this.formElements.namedItem("title").value.trim(),
            content: this.formElements.namedItem("content").value.trim(),
            author: this.formElements.namedItem("author").value.trim(),

            imageLink: this.formElements.namedItem("imageLink").value.trim(),
            tags: this.formElements.namedItem("tags").value.trim()
        };

        if (!(articleData.title && articleData.content)) {
            window.alert("Please, enter article title and content");
            return;
        }

        if (!articleData.author) {
            articleData.author = "Anonymous";
        }

        if (!articleData.imageLink) {
            delete articleData.imageLink;
        }

        if (!articleData.tags) {
            delete articleData.tags;
        } else {
            articleData.tags = articleData.tags.split(",");

            articleData.tags = articleData.tags.map(tag => tag.trim());

            articleData.tags = articleData.tags.filter(tag => tag);
            if (articleData.tags.length == 0) {
                delete articleData.tags;
            }
        }
        const postReqSettings =
        {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
            },
            body: JSON.stringify(articleData)
        };


        fetch(`${this.serverUrl}/article/${this.articleId}`, postReqSettings)
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    return Promise.reject(new Error(`Server answered with ${response.status}: ${response.statusText}.`));
                }
            })
            .then(responseJSON => {
                window.alert("Updated article successfully saved on server");
            })
            .catch(error => {
                window.alert(`Failed to save the updated article on server. ${error}`);

            })
            .finally(() => window.location.hash = `#article/${this.articleId}/${this.offset}/${this.totalCount}`);

    }


}

