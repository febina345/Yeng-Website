function addToCart(proId) {
    $.ajax({
      url: '/add-to-cart/' + proId,
      method: 'get',
      success: (response) => {
        if (response.status) {
          let count = $('#cart-count').html();
          console.log("Before parsing:", count); // Add this to see if it's a string
          count = parseInt(count) + 1;
          console.log("After parsing:", count);  // Should be a number now
          $("#cart-count").html(count);
        }
        alert(response);
      }
    });
  }
  