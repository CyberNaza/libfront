document.addEventListener("DOMContentLoaded", () => {
    console.log("home.js loaded");
  
    const usernameSpan = document.getElementById("username");
    const messageBox = document.getElementById("response-message");
    const booksList = document.getElementById("books-list");
    const logoutLink = document.querySelector('a[href="/logout"]');
  
    if (!usernameSpan || !messageBox || !booksList) {
      console.error("Username span, message box, or books list not found");
      return;
    }
  
    // Handle logout
    if (logoutLink) {
      logoutLink.addEventListener("click", (event) => {
        event.preventDefault();
        console.log("Logging out");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("fullName");
        messageBox.style.color = "green";
        messageBox.innerText = "Logged out successfully!";
        usernameSpan.innerText = "Guest";
        booksList.innerHTML = "";
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      });
    }
  
    // Get full_name and access token from localStorage
    const fullName = localStorage.getItem("fullName");
    const accessToken = localStorage.getItem("accessToken");
  
    if (!accessToken || !fullName) {
      console.log("No access token or full_name found, user not logged in");
      messageBox.style.color = "orange";
      messageBox.innerText = "You are not logged in. Please log in.";
      usernameSpan.innerText = "Guest";
      booksList.innerHTML = "<p>Please log in to view your books.</p>";
      return;
    }
  
    // Display username
    console.log("Displaying full_name:", fullName);
    usernameSpan.innerText = fullName;
    messageBox.style.color = "green";
    messageBox.innerText = `Welcome, ${fullName}!`;
  
    // Fetch books list
    console.log("Fetching books list");
    fetch("http://159.89.108.157:8000/library/books/", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        console.log("Books list response status:", response.status);
        const rawResponse = response.text();
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return rawResponse;
      })
      .then((rawResponse) => {
        let data;
        try {
          data = JSON.parse(rawResponse);
          console.log("Books data:", data);
        } catch (jsonError) {
          console.error("Failed to parse JSON:", jsonError.message);
          console.log("Raw response:", rawResponse);
          throw new Error("Invalid server response");
        }
  
        if (Array.isArray(data) && data.length > 0) {
          // Assuming response is an array of books, e.g., [{id: 1, title: "Book 1"}, ...]
          booksList.innerHTML = "<h3>Your Books</h3><ul>" + 
            data.map(book => `<li>${book.title || "Untitled Book"} (ID: ${book.id})</li>`).join("") +
            "</ul>";
        } else {
          booksList.innerHTML = "<p>No books found.</p>";
        }
      })
      .catch((err) => {
        console.error("Books fetch error:", err.message);
        booksList.innerHTML = "<p>Error loading books.</p>";
        messageBox.style.color = "red";
        if (err.message.includes("401")) {
          messageBox.innerText = "Session expired. Please log in again.";
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("fullName");
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
        } else if (err.message.includes("404")) {
          messageBox.innerText = "Books endpoint not found. Please check the backend.";
        } else {
          messageBox.innerText = `Failed to fetch books: ${err.message}`;
        }
      });
  });



  