

export default function processOpnFrmData(event) {
    event.preventDefault();

    const nopNameField = document.getElementById("nameElm");
    const nopName = nopNameField.value.trim();
    const nopEmail = document.getElementById("emailElm")?.value.trim();
    const nopImageUrl = document.getElementById("imageUrlElm")?.value.trim();
    const nopFeedbackType = document.querySelector("input[name='feedbackType']:checked")?.value || "";
    const nopSubscribe = document.getElementById("subscribeElm")?.checked || false;
    const nopWillReturn = document.getElementById("willReturnElm")?.checked || false;
    const nopOpn = document.getElementById("opnElm")?.value.trim();
    const nopKeywords = document.getElementById("keywordsElm")?.value.trim();

    if (!nopName || !nopOpn || !nopFeedbackType) {
        alert("Please, complete all required fields (name, opinion, feedback type).");
        return;
    }

    const newOpinion = {
        name: nopName,
        email: nopEmail,
        imageUrl: nopImageUrl,
        feedbackType: nopFeedbackType,
        subscribe: nopSubscribe,
        willReturn: nopWillReturn,
        comment: nopOpn,
        keywords: nopKeywords,
        created: new Date().toISOString(),
    };

    let opinions = [];
    if (localStorage.myTreesComments) {
        opinions = JSON.parse(localStorage.myTreesComments);
    }
    opinions.push(newOpinion);
    localStorage.myTreesComments = JSON.stringify(opinions);

    window.location.hash = "#opinions";
}
