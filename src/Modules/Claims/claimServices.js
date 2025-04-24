// tourClaimService.js

export const getDraftData = async () => {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhbmlzaC5rdW1hckBncmVlbndhdmUuY28uaW4iLCJpYXQiOjE3NDU0ODM0NjEsImV4cCI6MTc0NTQ4NzA2MX0.uP0EUHwcZwKmDRkfYziJuvn5JFwGfSyQSF6P1SUnJiA");

    const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    };

    try {
        const response = await fetch("http://localhost:8081/claims/tour-claims/drafts", requestOptions);
        const data = await response.json(); // ✅ directly parse
        return data;

    } catch (error) {
        console.error("Error fetching draft data:", error);
       throw error;
       // return []; // ✅ always return an array
    }
};


export const handleSaveToDraft = (payload) => {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", "Bearer YOUR_TOKEN_HERE");

    const raw = JSON.stringify(payload);

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
    };

    return fetch("http://localhost:8081/claims/tour-claims", requestOptions)
        .then((response) => response.json())
        .catch((error) => {
            console.error("Error saving draft:", error);
            throw error;
        });
};
