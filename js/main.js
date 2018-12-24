

    let originalResponse
    // let images = [
    //     "http://danielcardona.co/book-reading/attention-merchants/001.jpg",
    //     "http://danielcardona.co/book-reading/attention-merchants/002.jpg",
    //     "http://danielcardona.co/book-reading/attention-merchants/003.jpg",
    // ]
    let images


    //Global non-jQuery Variables 
    var img = document.getElementById("imagensita");
    var c = document.getElementById("canvas-imagensita");
    var ctx = c.getContext("2d");
    let base64Data
    var myImage = new Image()



    //--------------- Materialize Select Box ----------------
    // document.addEventListener('DOMContentLoaded', function() {
    //     var elems = document.querySelectorAll('select');
    //     var instances = M.FormSelect.init(elems, options);
    //   });
    
      // Or with jQuery
    
    //   $(document).ready(function(){
    //     $('select').formSelect();
    //   });
    //--------------- Materialize Select Box ----------------



    $(document).ready(function(){

        //--------------- Materialize Select Box ----------------
        // initialize
        $('select').formSelect();

        // setup listener for custom event to re-initialize on change
        $('.material-select').on('contentChanged', function() {
            $(this).formSelect();
        });
        //--------------- Materialize Select Box ----------------

        //Global jQuery Variables 
        let imagesDropdown = $("#images-dropdown")
        let selectedImage
        let confidenceDisplayArea = $("#confidence")
        

        function getResources(location, resourceName){
            return new Promise((resolve, reject) => {
                $.ajax({
                    url: location,
                    type: 'get',
                    dataType: 'json',
                    success: function(response){
                        console.log('response', response);
                        console.log('response.key', response[resourceName]);
                        resolve(response[resourceName])
                    }
                })
            })
        }

        //canvas styling and manipulation
        //ctx.fillRect(200,0,100,100)
        //ctx.fillStyle = "#76f2534f"


        //request to the local copy of a response saved in './response.json'
        $("#local-response-test").click(function(){
            $.ajax({
                url: './resources/response2.json',
                type: 'get',
                dataType: 'json',
                success: function(response){
                    console.log('response', response)
                    originalResponse = response
                    handleResponse(response)
                    let base64image = encodeImage(img)
                    toggleImageAndCanvas()
                }
            })
        })

        function displayImage(imageSource){
            img.src = imageSource
            let base64image = encodeImage(img)
        }

        //prints the images on the screen
        getResources('./resources/resources.json', 'localImages')
        .then(function(images_){
            if(images_){
                images = images_
                img.src = images[0]
                for (let index = 0; index < images.length; index++) {
                    let image = images[index]
                    imagesDropdown.append("<option value='"+image+"' data-icon='"+image+"'>"+image+"</option>")
                    // fire custom event anytime you've updated select
                    imagesDropdown.trigger('contentChanged');
                }
                imagesDropdown.on('change', function(){
                    console.log('imagesDropdown.formSelect(getSelectedValues)', $(this).val());
                    selectedImage = $(this).val()
                    displayImage($(this).val())
                    clearConfidenceDisplayArea()
                })
            } else {
                console.log('there was a problem retrieving the images');
            }
        })



        

        function encodeImage(img_){
            let w = img_.naturalWidth 
            let h = img_.naturalHeight
            ctx.drawImage(img_,0,0, 400/(h/w), 400)
            let returnString = c.toDataURL()
            returnString.indexOf(',')
            returnString = returnString.slice(returnString.indexOf(',')+1, returnString.length)
            return returnString
        }

        function toggleImageAndCanvas(){
            $("#imagensita").toggleClass("hidden")
            $("#canvas-imagensita").toggleClass("hidden")

        }

        //request to the actual GCP API
        $("#api-test").click(function(){
            console.log('butTest');
            getResources('./resources/resources.json', 'key')
            .then(function(key_){
                let jsonData = JSON.stringify({
                    "requests":[
                        {
                        "image":{
                            "content": encodeImage(img),
                            // "source":{
                            // // "imageUri":"http://danielcardona.co/book-reading/attention-merchants/002.jpg"
                            // "imageUri": images[1]
                            // }
                        },
                        "features":[
                            {
                            "type":"DOCUMENT_TEXT_DETECTION",
                            }
                        ]
                        }
                    ]
                })
                $.ajax({
                url: 'https://vision.googleapis.com/v1/images:annotate?key='+key_,
                type: 'post',
                data: jsonData,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                success: function(response){
                        console.log('response', response);
                        handleResponse(response)
                        toggleImageAndCanvas()
                    },
                });
            })

        });

        function handleResponse(response_){
            //Checks that the response is not an error
            if(response_.responses[0].error){
                let errorCode = response_.responses[0].error.code
                let errorMessage = response_.responses[0].error.message
                $("#content").text("<p class='error-message'>error code: "+errorCode+" --> "+errorMessage+"<p>")
    
            }
    
    
            let fullText = response_.responses[0].fullTextAnnotation.text
            $("#content").text(fullText)
            let pages = response_.responses[0].fullTextAnnotation.pages
            for (let i = 0; i<pages.length; i++){
                let block = pages[i].blocks
                for (let j = 0; j<block.length; j++){
                    let confidence_ = block[j].confidence
                    confidenceDisplayArea.append("<p>page: "+i+", block: "+j+", has a confidence of: "+confidence_+"<p>")
                }
            }
            let confidence = response_.responses[0].fullTextAnnotation.pages[0].blocks[0].confidence

        }

        function clearConfidenceDisplayArea(){
            confidenceDisplayArea.text("")
        }






    });
