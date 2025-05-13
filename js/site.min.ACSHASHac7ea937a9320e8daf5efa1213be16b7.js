$(document).ready(function() {
    "use strict";

    if($(".highlight .card-background picture img")){
        var highlightImgAsset = $('img[id^="img-highlight-"]');
        var cardBodyLG = $('div[id^="card-body-highlight-"] .link-group');
        if(highlightImgAsset.length>0){
            for(var i=0; i<highlightImgAsset.length;i++){
                if(highlightImgAsset[i]){
                    var assetSrc = highlightImgAsset[i].src;
                    if(cardBodyLG[i]){
                        if(cardBodyLG[i].children.length>0){
                            for(var j=0;j<cardBodyLG[i].children.length;j++){
                                cardBodyLG[i].children[j].setAttribute("data-bi-assetid", assetSrc);
                            }
                        }
                    }
                }
            }
        }
    }

    function highlightComponentV1(){
        let subscriptEles =document.querySelectorAll(".highlight sup");
        let footnoteEle = `<span class="sr-text">Footnote</span>`;
        subscriptEles.forEach(ele=>{
            if(ele.children.length==0)
            ele.insertAdjacentHTML('afterbegin',footnoteEle)
        })
    }
    highlightComponentV1();

    document.querySelectorAll("div.highlight .link-group > a").forEach(function(item) {
        // Read the Heading text of highlight component
        var jsllHeading = item.closest(".card-body");
        var parentComponent = item.closest(".carousel-highlight");
        if (jsllHeading) {

            var heading = jsllHeading.querySelector("h1, h2, h3, h4, h5, h6");

            if(heading && heading.textContent) {
                // assign to data-bi-ehn attribute
                item.dataset.biEhn = heading.textContent.trim();

                // assign to data-bi-hn attribute
                item.dataset.biHn = heading.textContent.trim();
            }

            // Set the data-bi-compname attribute to Highlight Carousel if it is part of the Highlight Carousel component
            if(parentComponent) {
                item.dataset.biCompnm = "Highlight Carousel";
            } else {
               // Read the Component name and assign to data-bi-compname attribute
               var compName = jsllHeading.getAttribute("data-highlight-compname");
               if(compName) {
               	   item.dataset.biCompnm = jsllHeading.getAttribute("data-highlight-compname");
               } else {
               	 item.dataset.biCompnm = "Highlight";
               }
            }
        }

        // Assign 0 data-bi-bhvr attribute
        item.dataset.biBhvr = 0;

        var targetDiv = item.closest("div.card");

        // Copy data attributes from anchor element to target div
        $.each(item.dataset, function(key, value) {
            if( key === 'target') {
                targetDiv.dataset['target']= '#';
            } else if (key !== "automationTestId") {
                targetDiv.dataset[key]= value;
            }
        });
        targetDiv.dataset.biCt = "Image";
    });
});
$(document).ready(function () {
    "use strict";
    let highlightExperimentFlag = false;
    let hightlightQspFlag = false;

    window.addEventListener('HOME_HIGHLIGHT_PERSONALIZATION_TOGGLE', function(event) {
        if (event.detail.onOff === 'on') {
            highlightExperimentFlag = true;
        }  else if (event.detail.onOff === 'off') {
            highlightExperimentFlag = false;
        }
     });

     const highlightQsp = new URLSearchParams(location.search)?.get('pb')?.startsWith('true');
     if (highlightQsp) {
         hightlightQspFlag = true;
     }

    $(".carousel-highlight").each(function (i, carouselInstance){
        var highlightObj = $(carouselInstance).find('.carousel-inner .carousel-item:first-child');
        // check if highlightObj is not null
        if(highlightObj) {
            let highLightCardObj = $(highlightObj).find('.card-background');
            const apiEndpoint = $(highLightCardObj).data('boost-endpoint');
            const tagId = $(highLightCardObj).data('tag-id');
            // Get the checkbox property from the component dialog
            const isPersonalizedViaBoost = $(highLightCardObj).data('personalize-via-boost');
            // Get the ECS Flag
            const isPersonalizedViaBoostECSFlag = $(highLightCardObj).data('personalize-via-boost-ecs-flag');
            const locale = $(highLightCardObj).data('locale');
            // Check if the target event is 'on' or if the query parameter is 'true'
            var callBoostCondition = $.trim(highlightExperimentFlag) === 'true' || $.trim(hightlightQspFlag) === 'true';
            // Call the boost api to get the personalized image
            // and replace the first highlight of the component
            if ($.trim(isPersonalizedViaBoost) === 'true' && $.trim(isPersonalizedViaBoostECSFlag) === 'true' && callBoostCondition) {
                if($.trim(apiEndpoint) !== '' && $.trim(tagId) !== '') {
                    console.log("Calling Boost API");
                    callBoostAPI(apiEndpoint, $.trim(tagId), $.trim(locale), carouselInstance);
                } else {
                    console.log("Boost API endpoint or tagId is not configured");
                    removeFirstSlideAndforwardControls(carouselInstance);
                    return;
                }
            } else if ($.trim(isPersonalizedViaBoost) === 'true' && ($.trim(isPersonalizedViaBoostECSFlag) === 'false' || !callBoostCondition)) {
                console.log("Personalization via Boost is not enabled");
                removeFirstSlideAndforwardControls(carouselInstance);
                return;
            } else {
                return;
            }
        }
    });

    function callBoostAPI(apiEndpoint, tagId, locale, carouselInstance) {
        const payload = {
                  "id": generateRandomId(),
                  "imp": [
                    {
                      "id": generateHyphenatedId(),
                      "tagId": tagId,
                      "native": {
                        "request": "{\"ver\":\"1.1\",\"privacy\":1,\"assets\":[{\"id\":1,\"required\":1,\"title\":{}},{\"id\":2,\"required\":1,\"data\":{\"type\":2}},{\"id\":3,\"required\":1,\"data\":{\"type\":12}},{\"id\":4,\"required\":1,\"img\":{\"w\":539,\"h\":440,\"type\":3}},{\"id\":5,\"required\":1,\"img\":{\"w\":859,\"h\":540,\"type\":3}},{\"id\":6,\"required\":1,\"img\":{\"w\":1083,\"h\":600,\"type\":3}},{\"id\":7,\"required\":1,\"img\":{\"w\":1399,\"h\":600,\"type\":3}},{\"id\":8,\"required\":1,\"img\":{\"w\":1920,\"h\":600,\"type\":3}}]}"
                      }
                    }
                  ],
                  "site": {
                    "page": window.location.href,
                    "content": {
                      "ext": {
                        "locale": locale
                      }
                    }
                  },
                  "device": {
                    "geo": {
                        "country": "US"
                    }
                  },
                  "user": {
                    "ext": {
                      "anid": getCookie('ANID'),
                      "muid": getCookie('MUID')
                    }
                  },
                  "test": 1,
                  "stubResponse": true
                };

        $.ajax({
            url: apiEndpoint,
            type: 'post',
            contentType: "application/json",
            data: JSON.stringify(payload),
            timeout: 2000,
            success: function (data) {
                // Extract image URLs from the JSON payload
                if (data.imp && data.imp.length > 0 && data.imp[0].Promotions && data.imp[0].Promotions.length > 0) {
                    var imagesArray = data.imp[0].Promotions[0].images;

                    var highlightObj = $(carouselInstance).find('.carousel-inner .carousel-item:first-child');
                    if(imagesArray && imagesArray.length > 0 && highlightObj) {
                        updateSourceAndImageElementWithWidthMapping(imagesArray, highlightObj);
                    }

                    const description = data.imp[0].Promotions[0].description;
                    const title = data.imp[0].Promotions[0].longTitle;
                    const actionText = data.imp[0].Promotions[0].actionText;
                    const targetURI = data.imp[0].Promotions[0].targetUrl;
                    // check if highlightObj is not null
                    if(highlightObj) {
                        //update description
                        $($(highlightObj).find('.card-foreground .card-body div.mb-4')[0]).text(description);
                        // update title
                        $($(highlightObj).find('.card-foreground .card-body :header')[0]).text(title);
                        // update anchor tag href and text content
                        var anchor = $(highlightObj).find('.card-foreground .card-body .link-group a')[0];
                        $(anchor).attr("href", targetURI);
                        $(anchor).addClass("btn btn-primary");
                        $(anchor).text(actionText);
                        // Update Telemetry attributes
                        var highlightCardDiv =  $($(highlightObj).find('.card-foreground .card'));
                        updateTelemetryAttributes(highlightCardDiv, anchor, actionText,targetURI,title);
                        // Fire Beacon calls
                        var beacons = data.imp[0].Promotions[0].Beacons;
                        if(beacons && beacons.length > 0 && beacons[0]) {
                            // Fire the event beacon with the 'impression'
                            if (beacons[0].MIFeedbackurl) {
                                fireBeacon(beacons[0].MIFeedbackurl);
                            }

                            // Register for "click" event on the button and call the event beacon with the 'click' action
                            if(beacons[0].EventUrl) {
                                $(anchor).on('click', () => {
                                    // Fire the event beacon with the 'click' action when the button is clicked
                                    fireEventBeacon(beacons[0].EventUrl, 'click');
                                });
                            }

                            // Fire "viewed" beacon when the element is in the viewport
                            if(beacons[0].MVFeedbackurl) {
                                onScroll(anchor, beacons[0].MVFeedbackurl);
                            }
                        }
                    }
                } else {
                    console.log("No images found in the Boost response");
                    removeFirstSlideAndforwardControls(carouselInstance);
                }
            },
           error: function (xhr, status, error) {
             // Handle the failure scenario
             console.error("AJAX request failed:", status, error);
             removeFirstSlideAndforwardControls(carouselInstance);
           }
         });
    }

    // This function removes the first slide and forward controls to the authored slides
    function removeFirstSlideAndforwardControls(carouselInstance) {
        // Hide the first carousel indicator
        var firstCarouselIndicator = $(carouselInstance).find('.carousel-indicators li:first-child');
        if(firstCarouselIndicator) {
            $(firstCarouselIndicator).remove();
        }
        // Hide the first slide
        var firstHighlightCarouselSlide = $(carouselInstance).find('.carousel-inner .carousel-item:first-child');
        if(firstHighlightCarouselSlide) {
            $(firstHighlightCarouselSlide).remove();
        }
        // Forward to the second slide
        var forwardCarouselSlide = $(carouselInstance).find('.carousel-inner .carousel-item:first-child');
        if(forwardCarouselSlide) {
            $(forwardCarouselSlide).addClass('active');
        }
        // Make the second carousel indicator active
        var secondCarouselIndicator = $(carouselInstance).find('.carousel-indicators li:first-child');
        if(secondCarouselIndicator) {
            $(secondCarouselIndicator).addClass('active');
        }
        updateCarouselInstance(carouselInstance);
    }

    function updateCarouselInstance(carouselInstance) {
        if (mwf) {
            var carouselInstances = mwf.Carousel.getInstances();
            if (carouselInstances) {
             // loop through the instances and compare it with the passed carousel instance
                for (var i = 0; i < carouselInstances.length; i++) {
                    if (carouselInstances[i].el === carouselInstance) {
                        // update the carousel instance
                        carouselInstances[i].controls.update();
                    }
                }
            }
        }
    }

     // This function creates a map of width to image object so that the
     // correct image gets replaced for the corresponding width
    function createWidthToImageMap(imagesArray) {
         var widthToImageMap = {};

         imagesArray.forEach(image => {
            if(image.width == 1399) {
                widthToImageMap[1084] = image;
            } else if (image.width == 1920) {
                widthToImageMap[1400] = image;
            } else if (image.width == 1083) {
                widthToImageMap[860] = image;
            } else if (image.width == 859) {
                widthToImageMap[540] = image;
            }
         });

         return widthToImageMap;
     }

    function updateSourceAndImageElementWithWidthMapping(imagesArray, highlightObj) {
         // Create the widthToImageMap
         var widthToImageMap = createWidthToImageMap(imagesArray);

         // Iterate over each source element
         if(widthToImageMap && Object.keys(widthToImageMap).length > 0) {
            // check if highlightObj is not null
            if(highlightObj) {
                $(highlightObj).find('.card-background picture source').each(function(index) {
                    // check if the image url is not null
                    // Get the media attribute value (e.g., "(min-width: 1400px)")
                     var mediaAttribute = $(this).attr('media');
                     // Extract the min-width from the media attribute
                     var minWidth = parseInt(mediaAttribute.match(/\d+/)[0]);
                     // Find the corresponding image object based on minWidth
                     var matchingImage = widthToImageMap[minWidth];
                     // If a matching image is found, update the srcset attribute
                     if (matchingImage) {
                         $(this).attr('srcset', matchingImage.imageUrl);
                     }
                });

                // update the img src
                var imgObj = $(highlightObj).find('.card-background picture img')[0];
                if (imgObj && widthToImageMap[540]) {
                    $(imgObj).attr("src",  widthToImageMap[540].imageUrl);
                    $(imgObj).attr("alt",  widthToImageMap[540].altText);
                }
             }
         }
     }

     // update telemetry attributes
     function updateTelemetryAttributes(highlightCardDiv, anchor, actionText,targetURI,title) {
        if (highlightCardDiv) {
            // Update Div card attributes
            $(highlightCardDiv).attr("data-bi-cn", actionText);
            $(highlightCardDiv).attr("data-bi-ecn", actionText);
            $(highlightCardDiv).attr("data-bi-ct", "Image");
            $(highlightCardDiv).attr("data-bi-pa", "body");
            $(highlightCardDiv).attr("data-target-uri", targetURI);
            $(highlightCardDiv).attr("data-bi-bhvr", "0");
            $(highlightCardDiv).attr("data-bi-ehn", title);
            $(highlightCardDiv).attr("data-bi-hn", title);
            $(highlightCardDiv).attr("data-bi-compnm", "Highlight Carousel");

            // Update anchor tag attributes
            $(anchor).attr("data-bi-cn", actionText);
            $(anchor).attr("data-bi-ecn", actionText);
            $(anchor).attr("data-bi-ct", "button");
            $(anchor).attr("data-bi-pa", "body");
            $(anchor).attr("data-target-uri", targetURI);
            $(anchor).attr("data-bi-bhvr", "0");
            $(anchor).attr("data-bi-ehn", title);
            $(anchor).attr("data-bi-hn", title);
            $(anchor).attr("data-bi-compnm", "Highlight Carousel");
        }
     }

     // Function to fire the event beacon with the specified action
    function fireEventBeacon(eventBeaconURL, action) {
       const eventBeaconActionURL = eventBeaconURL.replace('{ACTION}', action);
       // Send the event beacon asynchronously using sendBeacon
       fireBeacon(eventBeaconActionURL);
    }

    // Function to check if an element is in the viewport
    function isElementInViewport(el) {
      const rect = el.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    }

    // Function to handle scroll event
    function onScroll(elementToTrack, beaconURL) {
      function scrollHandler() {
        if (isElementInViewport(elementToTrack)) {
          fireBeacon(beaconURL);
          // Remove the event listener after firing the beacon
          window.removeEventListener('scroll', scrollHandler);
        }
      }

      // Attach the scroll event listener
      window.addEventListener('scroll', scrollHandler);
    }

    function fireBeacon(beaconURL) {
        fetch(beaconURL, {
          method: 'GET',
        })
          .then(response => {
            // Handle response if needed
            console.log('Beacon fired successfully:', response);
          })
          .catch(error => {
            // Handle error if the beacon fails
            console.error('Beacon failed to fire:', error);
          });
    }

    // Retrieve cookie value
    function getCookie(name) {
         const cookies = document.cookie.split(';');
         for (let i = 0; i < cookies.length; i++) {
             const cookie = cookies[i].trim();
             if (cookie.startsWith(name + '=')) {
                 return cookie.substring(name.length + 1);
             }
         }
         return null;
     }

    function generateRandomId() {
       // For the format "68B871CF4888496AAE0351436F86B493"
       return ([1e7] + 1e3 + 4e3 + 8e3 + 1e11).replace(/[018]/g, c =>
              (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
          ).toUpperCase();
     }

    function generateHyphenatedId() {
       // For the format "111c3692-bc66-40c9-8b43-734dbac9427d"
       return crypto.randomUUID() ||
          ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
               (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
          );
     }
});
(()=>{"use strict";var t={n:e=>{var a=e&&e.__esModule?()=>e.default:()=>e;return t.d(a,{a}),a},d:(e,a)=>{for(var i in a)t.o(a,i)&&!t.o(e,i)&&Object.defineProperty(e,i,{enumerable:!0,get:a[i]})},o:(t,e)=>Object.prototype.hasOwnProperty.call(t,e)};const e=jQuery;var a=t.n(e);a()((function(){var t;!function(t,e,i){var r=arguments.length>3&&void 0!==arguments[3]?arguments[3]:".aem-Grid";e.forEach((function(e){var n=new MutationObserver((function(e){e.forEach((function(e){var n=a()(e.addedNodes).find(".f-play-trigger");if(n.length>0){if(i){var o=i(n.closest(r)).text().trim();n.attr("data-bi-hN",o),n.attr("data-bi-ehN",o)}n.attr("data-bi-cN","Video Launch"),n.attr("data-bi-ecN","Video Launch"),n.attr("data-bi-bhvr","240"),n.attr("data-bi-cT","Video"),n.attr("data-bi-pA","Body"),n.attr("data-bi-compNm",t)}})),n.disconnect()}));n.observe(e,{childList:!0,subtree:!0})}))}("Highlight",document.querySelectorAll(".highlight"),(function(t){return t.find(":header")}),".highlight"),(t=document.querySelectorAll(".highlight .video-modal.pause-onhide .embed-responsive.embed-responsive-16by9"))&&0!==t.length&&t.forEach((function(t){t.classList.add("mh-100");var e=new MutationObserver((function(t){t.forEach((function(t){t.addedNodes.forEach((function(t){var a=t;a.classList&&a.classList.contains("c-video-player")&&(a.classList.add("mh-100"),a.style.minWidth="auto",e.disconnect())}))}))}));e.observe(t,{childList:!0,subtree:!0})}))}))})();
