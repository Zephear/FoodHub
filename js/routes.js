import Mustache from "./mustache.js";
import processOpnFrmData from "./addOpinion.js";

export default [

    {
        hash: "welcome",
        target: "router-view",
        getTemplate: (targetElm) =>
            document.getElementById(targetElm).innerHTML =
            document.getElementById("template-welcome").innerHTML
    },
    {
        hash: "articles",
        target: "router-view",
        getTemplate: fetchAndDisplayArticles
    },
    {
        hash: "opinions",
        target: "router-view",
        getTemplate: createHtml4opinions
    },
    
    {
        hash: "addOpinion",
        target: "router-view",
        getTemplate: (targetElm) => {
            document.getElementById(targetElm).innerHTML = document.getElementById("template-addOpinion").innerHTML;
    
            const opinionForm = document.getElementById("opnFrm");
            opinionForm.onsubmit = processOpnFrmData;

            if (isUserLoggedIn()) {
                const loggedInUser = getLoggedInUserData();
                const nameField = document.getElementById("nameElm");
                const emailField = document.getElementById("emailElm");
    
                nameField.value = loggedInUser.name;
                nameField.disabled = true; 
                if (emailField) {
                    emailField.value = loggedInUser.email;
                    emailField.disabled = true;
                }
            }
        }
    },
    
    {
        hash: "article",
        target: "router-view",
        getTemplate: fetchAndDisplayArticleDetail
    },
    {
        hash: "artEdit",
        target: "router-view",
        getTemplate: editArticle
    },
    {
        hash: "artDelete",
        target: "router-view",
        getTemplate: deleteArticle
    },
    {
        hash: "menuTitle",
        target: "router-view",
        getTemplate: (targetElm) => {
            document.getElementById(targetElm).innerHTML =
                document.getElementById("template-welcome").innerHTML;
        }
    },
    {
        hash: "artInsert",
        target: "router-view",
        getTemplate: insertArticle
    }

];

const urlBase = "https://wt.kpi.fei.tuke.sk/api";
const articlesPerPage = 20;

function createHtml4opinions(targetElm) {
    const opinionsFromStorage = localStorage.myTreesComments;
    let opinions = [];

    if (opinionsFromStorage) {
        opinions = JSON.parse(opinionsFromStorage);
        opinions.forEach(opinion => {
            opinion.created = (new Date(opinion.created)).toDateString();
            opinion.willReturn =
                opinion.willReturn ? "I will return to this page." : "Sorry, one visit was enough.";
        });
    }

    document.getElementById(targetElm).innerHTML = Mustache.render(
        document.getElementById("template-opinions").innerHTML,
        opinions
    );
}

function fetchAndDisplayArticles(targetElm, offsetFromHash = 0, totalCountFromHash = 0) {
    const offset = Number(offsetFromHash);
    const totalCount = Number(totalCountFromHash);

    const urlQuery = `?offset=${offset}&max=${articlesPerPage}`;
    const url = `${urlBase}/article${urlQuery}`;

    const reqListener = function () {
        if (this.status === 200) {
            const responseJSON = JSON.parse(this.responseText);

            const hasNext = offset + articlesPerPage < responseJSON.meta.totalCount;
            const hasPrevious = offset > 0;

            const templateData = {
                articles: responseJSON.articles.map(article => ({
                    ...article,
                    detailLink: `#article/${article.id}/${offset}/${responseJSON.meta.totalCount}`,
                })),
                hasNext,
                hasPrevious,
                nextPage: hasNext ? offset + articlesPerPage : null,
                previousPage: hasPrevious ? Math.max(offset - articlesPerPage, 0) : null,
            };

            document.getElementById(targetElm).innerHTML = Mustache.render(
                document.getElementById("template-articles").innerHTML,
                templateData
            );
        } else {
            document.getElementById(targetElm).innerHTML = Mustache.render(
                document.getElementById("template-articles-error").innerHTML,
                { errMessage: this.responseText }
            );
        }
    };

    const ajax = new XMLHttpRequest();
    ajax.addEventListener("load", reqListener);
    ajax.open("GET", url, true);
    ajax.send();
}


function fetchAndDisplayArticleDetail(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
    if (!artIdFromHash) {
        document.getElementById(targetElm).innerHTML = "<p>Article ID is missing</p>";
        return;
    }

    const url = `${urlBase}/article/${artIdFromHash}`;
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error fetching article: ${response.statusText}`);
            }
            return response.json();
        })
        .then(articleData => {
            articleData.backLink = `#articles/${offsetFromHash}/${totalCountFromHash}`;
            articleData.editLink = `#artEdit/${artIdFromHash}/${offsetFromHash}/${totalCountFromHash}`;
            articleData.deleteLink = `#artDelete/${artIdFromHash}/${offsetFromHash}/${totalCountFromHash}`;

            const commentsKey = `comments_${artIdFromHash}`;
            let comments = JSON.parse(localStorage.getItem(commentsKey) || "[]");

            comments.forEach(comment => {
                comment.created = new Date(comment.created).toLocaleString();
            });

            articleData.comments = comments;

            document.getElementById(targetElm).innerHTML = Mustache.render(
                document.getElementById("template-article-comments").innerHTML,
                articleData
            );
   
            const toggleButton = document.getElementById("toggleCommentForm");
            const commentForm = document.getElementById("commentForm");

            toggleButton.addEventListener("click", () => {
                commentForm.classList.toggle("hidden");
            });

            if (isUserLoggedIn()) {
                const loggedInUser = getLoggedInUserData();
                document.getElementById("commentAuthor").value = loggedInUser.name;
            }

            commentForm.onsubmit = (event) => {
                event.preventDefault();

                const author = document.getElementById("commentAuthor").value.trim();
                const email = document.getElementById("commentEmail").value.trim();
                const content = document.getElementById("commentContent").value.trim();

                if (!author || !email || !content) {
                    alert("Please fill in all fields.");
                    return;
                }

                const newComment = {
                    author,
                    email,
                    content,
                    created: new Date().toISOString()
                };

                comments.push(newComment);
                localStorage.setItem(commentsKey, JSON.stringify(comments));

                fetchAndDisplayArticleDetail(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash);
            };
        })
        .catch(error => {
            document.getElementById(targetElm).innerHTML = `<p>Error loading article: ${error.message}</p>`;
        });
}


function editArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
    const url = `${urlBase}/article/${artIdFromHash}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error fetching article: ${response.statusText}`);
            }
            return response.json();
        })
        .then(articleData => {
            articleData.formTitle = "Edit Article";
            articleData.submitBtTitle = "Save Changes";
            articleData.backLink = `#articles/${offsetFromHash}/${totalCountFromHash}`;

            const loggedInUser = isUserLoggedIn() ? getLoggedInUserData().name : articleData.author;
            articleData.author = loggedInUser;

            document.getElementById(targetElm).innerHTML = Mustache.render(
                document.getElementById("template-article-form").innerHTML,
                articleData
            );

            const articleForm = document.getElementById("articleForm");
            articleForm.onsubmit = function (event) {
                event.preventDefault();

                const updatedArticleData = {
                    title: document.getElementById("title").value.trim(),
                    content: document.getElementById("content").value.trim(),
                    author: isUserLoggedIn() ? getLoggedInUserData().name : "Anonymous",
                    imageLink: document.getElementById("imageLink").value.trim(),
                    tags: document.getElementById("tags").value.trim()
                        .split(",")
                        .map(tag => tag.trim())
                        .filter(tag => tag)
                };

                const putRequestSettings = {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json;charset=utf-8"
                    },
                    body: JSON.stringify(updatedArticleData)
                };

                fetch(`${urlBase}/article/${artIdFromHash}`, putRequestSettings)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Failed to update article: ${response.statusText}`);
                        }
                        alert("Article updated successfully!");
                        window.location.hash = `#article/${artIdFromHash}/${offsetFromHash}/${totalCountFromHash}`;
                    })
                    .catch(error => {
                        alert(`Error updating article: ${error.message}`);
                    });
            };
        })
        .catch(error => {
            document.getElementById(targetElm).innerHTML = `<p>Error loading article for editing: ${error.message}</p>`;
        });
}


function deleteArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
    const url = `${urlBase}/article/${artIdFromHash}`;
    const ajax = new XMLHttpRequest();
    ajax.addEventListener("load", function () {
        if (this.status === 200) {
            window.location.hash = `#articles/${offsetFromHash}/${totalCountFromHash}`;
        } else {
            alert("Failed to delete the article. Please try again.");
        }
    });
    ajax.open("DELETE", url, true);
    ajax.send();
}

function fetchAndProcessArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash, forEdit) {
    const url = `${urlBase}/article/${artIdFromHash}`;

    function reqListener() {
        console.log(this.responseText)
        if (this.status == 200) {
            const responseJSON = JSON.parse(this.responseText)
            if (forEdit) {
                responseJSON.formTitle = "Article Edit";
                responseJSON.submitBtTitle = "Save article";
                responseJSON.backLink = `#article/${artIdFromHash}/${offsetFromHash}/${totalCountFromHash}`;

                document.getElementById(targetElm).innerHTML =
                    Mustache.render(
                        document.getElementById("template-article-form").innerHTML,
                        responseJSON
                    );
                if (!window.artFrmHandler) {
                    window.artFrmHandler = new articleFormsHandler("https://wt.kpi.fei.tuke.sk/api");
                }
                window.artFrmHandler.assignFormAndArticle("articleForm", "hiddenElm", artIdFromHash, offsetFromHash, totalCountFromHash);
            } else {
                responseJSON.backLink = `#articles/${offsetFromHash}/${totalCountFromHash}`;
                responseJSON.editLink =
                    `#artEdit/${responseJSON.id}/${offsetFromHash}/${totalCountFromHash}`;
                responseJSON.deleteLink = `#artDelete/${responseJSON.id}/${offsetFromHash}/${totalCountFromHash}`;


                document.getElementById(targetElm).innerHTML =
                    Mustache.render(
                        document.getElementById("template-article").innerHTML,
                        responseJSON
                    );
            }
        } else {
            const errMsgObj = { errMessage: this.responseText };
            document.getElementById(targetElm).innerHTML =
                Mustache.render(
                    document.getElementById("template-articles-error").innerHTML,
                    errMsgObj
                );
        }

    }

    console.log(url)
    var ajax = new XMLHttpRequest();
    ajax.addEventListener("load", reqListener);
    ajax.open("GET", url, true);
    ajax.send();

}

function insertArticle(targetElm) {
    const formData = {
        formTitle: "Add New Article",
        submitBtTitle: "Save article",
        backLink: "#articles/1/0",
        author: isUserLoggedIn() ? getLoggedInUserData().name : "",
        title: "",
        imageLink: "",
        content: "",
        tags: "",
    };

    document.getElementById(targetElm).innerHTML = Mustache.render(
        document.getElementById("template-article-form").innerHTML,
        formData
    );

    applyAuthRestrictions(); 

    const form = document.getElementById("articleForm");
    form.onsubmit = function (e) {
        e.preventDefault();

        const author = document.getElementById("author").value.trim();
        const title = document.getElementById("title").value.trim();
        const imageLink = document.getElementById("imageLink").value.trim();
        const content = document.getElementById("content").value.trim();
        const tags = document.getElementById("tags").value.trim();

        const data = {
            author,
            title,
            imageLink,
            content,
            tags: tags.split(",").map(t => t.trim()),
        };

        fetch("https://wt.kpi.fei.tuke.sk/api/article", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        })
            .then(response => {
                if (!response.ok) throw new Error("Failed to save article");
                return response.json();
            })
            .then(createdArticle => {
                alert("Article inserted successfully!");
                window.location.hash = `#article/${createdArticle.id}/0/0`;
            })
            .catch(error => {
                alert("Error: " + error.message);
            });
    };
}



function fetchAndDisplayComments(targetElm, articleId) {
    const commentsKey = `comments_${articleId}`;
    let comments = [];

    if (localStorage[commentsKey]) {
        comments = JSON.parse(localStorage[commentsKey]);
        comments.forEach(comment => {
            comment.created = new Date(comment.created).toLocaleString();
        });
    }

    const articleTitle = "Sample Article Title";
    const templateData = { title: articleTitle, comments };

    document.getElementById(targetElm).innerHTML = Mustache.render(
        document.getElementById("template-article-comments").innerHTML,
        templateData
    );

    document.getElementById("addCommentButton").onclick = () => {
        document.getElementById("commentForm").classList.toggle("hidden");
    };

    document.getElementById("commentForm").onsubmit = (event) => {
        event.preventDefault();

        const author = document.getElementById("commentAuthor").value.trim();
        const email = document.getElementById("commentEmail").value.trim();
        const content = document.getElementById("commentContent").value.trim();

        if (!author || !email || !content) {
            alert("Please fill in all fields.");
            return;
        }

        const newComment = {
            author,
            email,
            content,
            created: new Date()
        };

        comments.push(newComment);
        localStorage[commentsKey] = JSON.stringify(comments);

        fetchAndDisplayComments(targetElm, articleId);
    };
}


function isUserLoggedIn() {
    const userFirstName = localStorage.getItem("userFirstName");
    const userLastName = localStorage.getItem("userLastName");
    const userEmail = localStorage.getItem("userEmail");
    return userFirstName && userLastName && userEmail;
}


function getLoggedInUserData() {
    return {
        name: `${localStorage.getItem("userFirstName")} ${localStorage.getItem("userLastName")}`,
        email: localStorage.getItem("userEmail"),
    };
}

function applyAuthRestrictions() {
    if (isUserLoggedIn()) {
        const userData = getLoggedInUserData();

        const authorField = document.getElementById("author");
        const emailField = document.getElementById("email");
        if (authorField) {
            authorField.value = userData.name;
            authorField.setAttribute("readonly", "true");
        }
        if (emailField) {
            emailField.value = userData.email;
            emailField.setAttribute("readonly", "true");
        }
    }
}


function handleLogOut() {

    localStorage.removeItem("userFirstName");
    localStorage.removeItem("userLastName");
    localStorage.removeItem("userEmail");


    updateAuthUI();

    alert("You have successfully logged out.");
    window.location.reload(); 
}
function updateAuthUI() {
    const logoutButton = document.getElementById("logoutButton");
    const loginButton = document.querySelector(".g_id_signin");

    if (isUserLoggedIn()) {

        logoutButton.classList.remove("hiddenElm");
        loginButton.classList.add("hiddenElm");
    } else {

        logoutButton.classList.add("hiddenElm");
        loginButton.classList.remove("hiddenElm");
    }
}
function handleCredentialResponse(response) {
    const user = jwt_decode(response.credential);

    localStorage.setItem("userFirstName", user.given_name);
    localStorage.setItem("userLastName", user.family_name);
    localStorage.setItem("userEmail", user.email);

    updateAuthUI();

    alert(`Welcome, ${user.given_name}!`);
}
document.addEventListener("DOMContentLoaded", () => {
    updateAuthUI();

    const logoutButton = document.getElementById("logoutButton");
    logoutButton.addEventListener("click", handleLogOut);
});




