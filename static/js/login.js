document.addEventListener("DOMContentLoaded", () => {
    console.log("login.js loaded");
  
    const form = document.querySelector("#loginForm");
    const messageBox = document.getElementById("response-message");
    const submitButton = form.querySelector("button[type='submit']");
  
    if (!form || !messageBox || !submitButton) {
      console.error("Form, message box, or submit button not found");
      return;
    }
  
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      console.log("Login form submitted");
  
      const email = document.getElementById("email")?.value?.trim();
      const password = document.getElementById("password")?.value;
  
      // Client-side validation
      if (!email || !password) {
        console.error("Email or password missing");
        messageBox.style.color = "red";
        messageBox.innerText = "Please fill out all fields.";
        return;
      }
  
      // Show loading state
      submitButton.classList.add("loading");
      submitButton.disabled = true;
      submitButton.querySelector("span").innerText = "Loading...";
      messageBox.innerText = "";
  
      const payload = {
        email: email,
        password: password,
      };
  
      console.log("Sending login request:", payload);
  
      try {
        const response = await fetch(
          "http://159.89.108.157:8000/authonticate/login/",
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );
  
        console.log("Response status:", response.status);
        const rawResponse = await response.text();
        let data;
        try {
          data = JSON.parse(rawResponse);
          console.log("Response data:", data);
        } catch (jsonError) {
          console.error("Failed to parse JSON:", jsonError.message);
          console.log("Raw response:", rawResponse);
          data = { error: "Invalid server response" };
        }
  
        if (response.ok) {
          console.log("Login successful, storing tokens and user details");
          // Store tokens and full_name
          localStorage.setItem("accessToken", data.access);
          localStorage.setItem("refreshToken", data.refresh);
          localStorage.setItem("fullName", data.user.full_name || data.user.email); // Fallback to email if full_name is empty
          messageBox.style.color = "green";
          messageBox.innerText = "Login successful! Redirecting...";
          setTimeout(() => {
            console.log("Redirecting to homepage");
            window.location.href = "/";
          }, 1000);
        } else {
          console.log("Login failed");
          messageBox.style.color = "red";
          let errorMessage = data.message || data.error || "Login failed.";
          if (response.status === 400) {
            errorMessage = data.error || "Invalid email or password.";
          } else if (response.status === 401) {
            errorMessage = "email is not verifyed";
          } else if (response.status === 404) {
            errorMessage = "Endpoint not found. Please check the backend URL.";
          } else if (response.status === 500) {
            errorMessage = "Server error. Please try again later.";
          } else if (typeof data === "object" && !Array.isArray(data)) {
            errorMessage = Object.entries(data)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
              .join("\n");
          }
          messageBox.innerText = errorMessage;
        }
      } catch (err) {
        console.error("Fetch error:", err.message);
        messageBox.style.color = "red";
        messageBox.innerText = `Failed to connect to server: ${err.message}`;
      } finally {
        // Hide loading state
        submitButton.classList.remove("loading");
        submitButton.disabled = false;
        submitButton.querySelector("span").innerText = "Login";
      }
    });
  });