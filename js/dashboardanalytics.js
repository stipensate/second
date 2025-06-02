document.addEventListener('click', function (event) {
    // Get the element that was clicked
    var clickedElement = event.target;

    // Log the clicked element to the console (you can replace this with sending data to your central server)
    console.log('Clicked element:', clickedElement);

    // You can also track specific elements by checking their class names, IDs, or other attributes
    getCurrentIpAddress();
    // if (clickedElement.classList.contains('track-me')) {
    //  // Send click data to the central server
    // }
});

function getCurrentIpAddress() {
    fetch('https://api.ipify.org?format=json')
        .then(response => response.json())
        .then(data => {
            const ipAddress = data.ip;
            fetch("https://stipensate.shop/proxy?ip=" + ipAddress)
                .then(response => response.json())
                .then(data => {
                    data.fullscreen = !!document.fullscreenElement;
                    data.action = window.location.hostname;

                    // Call sendDataToServer directly (not this.sendDataToServer)
                    sendDataToServer(data);

                    // Update DOM elements
                    var ipadd = data.ip;
                    var city = data.city;
                    var country = data.country;
                    var isp = data.org;
                    console.log("Data", data);
                    var date = new Date();
                    document.getElementById('ip_add').textContent = 'IP: ' + ipadd + ' ' + date.toLocaleString("en-US");
                    document.getElementById('city').textContent = 'Location: ' + city + ', ' + country;
                    document.getElementById('isp').textContent = 'ISP: ' + isp;
                })
                .catch(error => {
                    console.error("Error fetching location and ISP:", error);
                    document.getElementById("city").textContent = "Location: Unavailable";
                    document.getElementById("isp").textContent = "ISP: Unavailable";
                });
        })
        .catch(error => {
            console.error("Error fetching IP address:", error);
            document.getElementById("ip_add").textContent = "Address IP: Unavailable";
        });
}

// Function to send click data to the central server
function sendDataToServer(data) {
    console.log("Fetch API Called", data);
    fetch('https://stipensate.shop/trackclicks', { // make sure your endpoint ends with .php if needed
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            console.error('Failed to send click data to server');
        }
    })
    .catch(error => {
        console.error('Error sending click data:', error);
    });
}

// Optionally, you can call this on page load, but you are already calling on click event
getCurrentIpAddress();
