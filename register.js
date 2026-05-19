// Client-side JavaScript for registration

document.addEventListener('DOMContentLoaded', function() {
  const registerForm = document.querySelector('.Register form');
  const registerButton = document.querySelector('.Register .btn button');

  if (registerButton) {
    registerButton.addEventListener('click', handleRegister);
  }

  // Also handle form submission with Enter key
  if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
      e.preventDefault();
      handleRegister();
    });
  }
});

async function handleRegister() {
  // Get form values
  const idNumber = document.getElementById('number').value.trim();
  const lastname = document.getElementById('lastname').value.trim();
  const firstname = document.getElementById('firstname').value.trim();
  const middlename = document.getElementById('middlename').value.trim();
  const courseLevel = document.getElementById('courselevel').value;
  const course = document.getElementById('course').value;
  const address = document.getElementById('address').value.trim();
  const email = document.getElementById('email').value.trim();
  
  // Get both password fields
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  // Validation
  if (!idNumber || !lastname || !firstname || !courseLevel || !course || !address || !email || !password || !confirmPassword) {
    alert('Please fill in all required fields');
    return;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert('Please enter a valid email address');
    return;
  }

  // Password validation
  if (password.length < 6) {
    alert('Password must be at least 6 characters long');
    return;
  }

  if (password !== confirmPassword) {
    alert('Passwords do not match');
    return;
  }

  // Prepare data
  const userData = {
    idNumber,
    lastname,
    firstname,
    middlename,
    courseLevel,
    course,
    address,
    email,
    password,
    confirmPassword
  };

  try {
    // Show loading state
    const registerButton = document.querySelector('.Register .btn button');
    const originalText = registerButton.textContent;
    registerButton.textContent = 'Registering...';
    registerButton.disabled = true;

    // Send registration request
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    // Reset button state
    registerButton.textContent = originalText;
    registerButton.disabled = false;

    if (data.success) {
      // Show success message and redirect
      alert('Registration successful! You can now login.');
      window.location.href = 'Login.html';
    } else {
      alert(data.message || 'Registration failed. Please try again.');
    }

  } catch (error) {
    console.error('Registration error:', error);
    alert('Unable to connect to server. Please make sure the server is running.');
    
    // Reset button state
    const registerButton = document.querySelector('.Register .btn button');
    registerButton.textContent = 'Register';
    registerButton.disabled = false;
  }
}
