let rootPath  ="https://mysite.itvarsity.org/apiKey/contactBook/"
let apiKey ="checkApikey()";

 function  checkApiKey() {
    if (!localStorage.getItem("apiKey")) {
        
        window.location.href ="enter-api-key.html";  
        return null;
    }
    return localStorage.getItem("apiKey");
}

