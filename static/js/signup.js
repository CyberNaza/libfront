document.addEventListener("DOMContentLoaded", () => {
    console.log("signup.js loaded");
  
    const form = document.querySelector("#registerForm");
    const messageBox = document.getElementById("response-message");
    const submitButton = form.querySelector("button[type='submit']");
  
    if (!form || !messageBox || !submitButton) {
      console.error("Form, message box, or submit button not found");
      return;
    }
  
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      console.log("Signup form submitted");
  
      const fullName = document.getElementById("full_name")?.value?.trim();
      const email = document.getElementById("email")?.value?.trim();
      const password = document.getElementById("password")?.value;
      const password2 = document.getElementById("password2")?.value;
  
      // Client-side validation
      if (!fullName || !email || !password || !password2) {
        console.error("One or more form fields are missing or empty");
        messageBox.style.color = "red";
        messageBox.innerText = "Please fill out all fields.";
        return;
      }
  
      if (password !== password2) {
        console.error("Passwords do not match");
        messageBox.style.color = "red";
        messageBox.innerText = "Passwords do not match.";
        return;
      }
  
      // Show loading state
      submitButton.classList.add("loading");
      submitButton.disabled = true;
      submitButton.innerText = "Loading...";
      messageBox.innerText = "";
  
      const payload = {
        full_name: fullName,
        email: email,
        password: password,
        password2: password2,
      };
  
      console.log("Sending signup request:", payload);
  
      try {
        const response = await fetch(
          "http://159.89.108.157:8000/authonticate/register/register/", // Corrected endpoint
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
        // Read response body only once
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
          console.log("Registration successful, saving email and redirecting");
          localStorage.setItem("signupEmail", email);
          messageBox.style.color = "green";
          messageBox.innerText = data.message || "Registration successful! Redirecting...";
          setTimeout(() => {
            console.log("Redirecting to /verify with email:", email);
            window.location.href = `/verify?email=${encodeURIComponent(email)}`;
          }, 1000);
        } else {
          console.log("Registration failed");
          messageBox.style.color = "red";
          let errorMessage = data.message || data.error || "Registration failed.";
          if (response.status === 400) {
            errorMessage = data.error || "Invalid input. Please check your details.";
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
        submitButton.classList.remove("loading");
        submitButton.disabled = false;
        submitButton.innerText = "Sign Up";
      }
    });
  });