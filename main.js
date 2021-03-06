// CONSTANTS

const API_URL = 'https://api.bitcraft.io:8080'
const BOTTOM_BANNER_SPEED = 300;

// GOOGLE ANALYTICS

function handleOutboundLinkClicks(event) {
  ga('send', 'event', {
    eventCategory: 'Outbound Link',
    eventAction: 'click',
    eventLabel: event.target.closest('a').href,
    // After the click is sent to Analytics, resume normal behavior
    hitCallback: function() {
      $(event.target).trigger(event.type);
    }
  });
}

function handleFormSubmission(name) {
  ga('send', 'event', {
    eventCategory: 'Form',
    eventAction: 'submit',
    eventLabel: name
  });
}

// POLYFILLS

Date.prototype.nextDayOfWeek = function(desired_day_of_week) {
  var nextDay = new Date();
  nextDay.setDate(this.getDate() + (desired_day_of_week + (7 - this.getDay())) % 7);
  return nextDay;
}

Date.prototype.getMonthName = function() {
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  return monthNames[this.getMonth()];
}

Date.prototype.getDateth = function() {
  var date = this.getDate();

  switch (date % 10) {
    case 1:
      return `${date}st`;
      break;
    case 2:
      return `${date}nd`;
      break;
    case 3:
      return `${date}rd`;
    default:
      return `${date}th`;
  }
}

// maxAge in days
function setCookie(key, value, maxAge) {
  if (maxAge === undefined) maxAge = 365;
  document.cookie = key + '=' + value + ';max-age=' + maxAge * 60 * 60 * 24;
}

function getCookie(key) {
  var keyValue = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)');
  return keyValue ? keyValue[2] : null;
}

function eraseCookie(key) {
  setCookie(key, '', -1);
}

// FUNCTIONS

function shiftWindow() {
  scrollBy(0, -100);
}

async function showSuccessNewsletterModal() {
  var current_date = new Date();

  // Hack so that if it's past 10 AM, the next newsletter date
  // shows up as next Saturday week and not today
  if (current_date.getHours() > 10) {
    current_date.setDate(current_date.getDate() + 1);
  }

  var next_newsletter_date = current_date.nextDayOfWeek(6);
  var month = next_newsletter_date.getMonthName();
  var date = next_newsletter_date.getDateth()

  var success_title = 'Confirmed!';
  var success_subtitle = 'Thanks for subscribing to our weekly newsletter!';
  var success_msg = `We send our newsletters every <span class="underline bold">\
    Saturday morning</span>, so you will receive your first newsletter on \
    ${month} ${date}.`;
  var success_msg_el = $("<div></div>").append(success_msg)[0];

  await swal({
    title: success_title,
    text: success_subtitle,
    content: success_msg_el,
    icon: 'success',
    className: 'success',
    button: 'Great!'
  });
}

async function showFailureNewsletterModal() {
  var error_title = 'Oops!';
  var error_subtitle = 'Something went wrong and we could not subscribe you to our \
  newsletter.';
  var error_msg = 'Maybe you are already subscribed with this email? If this problem \
  persists, please email us to <a href="mailto:help@bitcraft.io">help@bitcraft.io</a>.';
  var error_msg_el = $("<div></div>").append(error_msg)[0];

  await swal({
    title: error_title,
    text: error_subtitle,
    content: error_msg_el,
    icon: 'error',
    className: 'error'
  });
}

async function subscribeToNewsletter(email, afterHttpCall) {
  try {
    await axios.post(API_URL + '/subscribe', {
      email: email
    });
    
    if (afterHttpCall !== undefined) afterHttpCall();
    await showSuccessNewsletterModal();
  } catch (_err) {
    if (afterHttpCall !== undefined) afterHttpCall();
    await showFailureNewsletterModal();
  }
}

// EVENT LISTENERS

// Only listen for outbound links (i.e. that are empty or don't point to an id element)
$('a:not([href=""]):not([href^="#"])').one('click', function(event) {
  event.preventDefault();
  handleOutboundLinkClicks(event);
});

$('#contact-us-form').on('submit', function(event) {
  event.preventDefault()

  handleFormSubmission('Contact Us');

  var name_el = document.getElementById('contact-us-name');
  var email_el = document.getElementById('contact-us-email');
  var subject_el = document.getElementById('contact-us-subject');
  var message_el = document.getElementById('contact-us-message');

  // We perform this check in case some browser does not support
  // the "required" attribute we put in the HTML form
  var required_fields = [name_el, email_el, subject_el, message_el];
  var is_form_filled = true;
  required_fields.forEach((field) => {
    if (field.value === '') is_form_filled = false;
  });

  var submit_el = document.getElementById('contact-us-submit');
  var loader_el = document.getElementById('contact-us-loader');
  var response_el = document.getElementById('contact-us-response');

  // Disable submit button so we don't get duplicates
  submit_el.disabled = true;

  // Show the loader so that the user knows we're processing the request
  loader_el.classList.remove('hidden');

  // Preparing response div
  response_el.classList.remove('success');
  response_el.classList.remove('failure');
  response_el.classList.add('hidden');

  success_msg = 'We have received your message and will get back to you as soon as we can.'
  error_msg = 'Something went wrong and we could not send your message. \
    Please make sure you filled out all the fields. If this problem persists, please email us to \
    <a href="mailto:help@bitcraft.io">help@bitcraft.io</a>.';

  if (is_form_filled) {
    axios.post(API_URL + '/send', {
        name: name_el.value,
        email: email_el.value,
        subject: subject_el.value,
        message: message_el.value
      })
      .then((response) => {
        response_el.innerHTML = success_msg;
        
        // Make the response green
        response_el.classList.add('success');
        // Show the response
        response_el.classList.remove('hidden');
      })
      .catch((error) => {
        response_el.innerHTML = error_msg;
        
        // Make the response red
        response_el.classList.add('failure');
        // Show the response
        response_el.classList.remove('hidden');

        // Enable the button again only when sending the email fails
        submit_el.disabled = false;
      })
      .finally(() => {
        // No matter the response, hide the loader again
        loader_el.classList.add('hidden');
      });
  }
});

$('.bottom-banner-close').one('click', () => {
  $('.bottom-banner').slideToggle(BOTTOM_BANNER_SPEED);
});

$('.bottom-banner-never').one('click', () => {
  setCookie('never_newsletter', 'true', 30);
  $('.bottom-banner').slideToggle(BOTTOM_BANNER_SPEED);
});

var bottomSubmit = async function(event) {
  event.preventDefault()

  var submit_el = $('#bottom-banner-submit');
  var bottom_banner_el = $('.bottom-banner');

  // If it's already running stop executing to avoid duplicates
  if (submit_el.hasClass('running')) {
    return null;
  }

  handleFormSubmission('News Subscribe');

  var email_el = $('#bottom-banner-email');

  // We perform this check in case some browser does not support
  // the "required" attribute we put in the HTML form
  var required_fields = [email_el];
  var is_form_filled = true;
  required_fields.forEach((field) => {
    if (field.val() === '') is_form_filled = false;
  });

  if (!is_form_filled) return null;

  // Loading button starts running after the email is submitted
  // but before the request is made
  submit_el.addClass('running');

  // Calls our API to subscribe the email to our newsletter and
  // awaits until the modals created by this function are closed
  await subscribeToNewsletter(email_el.val(), () => {
    submit_el.removeClass('running'); // Right after the HTTP call is made it calls this callback
  });

  bottom_banner_el.slideToggle(BOTTOM_BANNER_SPEED);
}

$('#bottom-banner-submit').on('click', bottomSubmit)
$('#bottom-banner-form').on('submit', bottomSubmit)

var newsletterSubmit = async function(event) {
  event.preventDefault()

  var submit_el = $('#newsletter-submit');

  // If it's already running stop executing to avoid duplicates
  if (submit_el.hasClass('running')) {
    return null;
  }

  handleFormSubmission('News Subscribe Section');

  var email_el = $('#newsletter-email');

  // We perform this check in case some browser does not support
  // the "required" attribute we put in the HTML form
  var required_fields = [email_el];
  var is_form_filled = true;
  required_fields.forEach((field) => {
    if (field.val() === '') is_form_filled = false;
  });

  if (!is_form_filled) return null;

  // Loading button starts running after the email is submitted
  // but before the request is made
  submit_el.addClass('running');

  // Calls our API to subscribe the email to our newsletter and
  // awaits until the modals created by this function are closed
  await subscribeToNewsletter(email_el.val(), () => {
    submit_el.removeClass('running'); // Right after the HTTP call is made it calls this callback
  });
}

// $('#newsletter-submit').on('click', newsletterSubmit)
// $('#newsletter-form').on('submit', newsletterSubmit)

// If people tap on our navbar buttons, it scrolls up a
// bit so that the navbar does not cover the content
$(window).on('hashchange', shiftWindow);

// ON LOAD

$(document).ready(function() {
  // If the website loads on an anchor (e.g. /#newsletter),
  // it scrolls up a bit so that the navbar does not cover the content
  if (location.hash) shiftWindow();

  // if (getCookie('never_newsletter') !== 'true' && window.location.hash.substr(1) !== 'newsletter') {
  //   $('.bottom-banner').delay(1000).slideToggle(BOTTOM_BANNER_SPEED);
  // }
});
