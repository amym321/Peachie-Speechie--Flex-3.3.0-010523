var optionsMapAvailableEventReceived = false;

(function () {
  // get the product form
  var $productForm = $('.product-form-container').find('.product_form');
  // get the json data from product form
  var JSONData = $productForm.data('product');
  // get the id of product
  var productID = JSONData.id;
  // event listener for when optionsMapAvailable event is fired on the document
  $(document).on('optionsMapAvailable', function () {
    // if we have already populated the optionsMap, do nothing
    if (optionsMapAvailableEventReceived) return;
    optionsMapAvailableEventReceived = true;
    optionsMap = Shopify.optionsMap || optionsMap;
    var parent =
      '.product-' +
      document.querySelector('.product-gallery__main').dataset.productId +
      ' .js-product_section';
    // attaching change event listener on the first option box
    $(parent)
      .find(`[data-option-index="0"]`)
      .change(function () {
        updateOptionsInSelector(0, parent);
      });
    // attaching change event listener on the second option box
    $(parent)
      .find(`[data-option-index="1"]`)
      .change(function () {
        updateOptionsInSelector(1, parent);
      });
    // takes parameters from url, if it exists search through JSONData and confirm it is available or not
    // if so set variantAvailableOnLoad to true
    var params = new URLSearchParams(location.search);
    var variantAvailableOnLoad = false;
    var selectedVariantId = params.get('variant');
    //var themeEditorShowVariantOnLoad = $('[data-variant-option-chosen-value]').data("variantOptionChosenValue")
    // get the first option 
    var themeEditorShowVariantOnLoad = $('[data-option-index="0"]').find('[data-variant-option-chosen-value].options-selection__option-name').data("variantOptionChosenValue")
    if (selectedVariantId && themeEditorShowVariantOnLoad != false) {
      let variant = JSONData.variants.filter((v) => v.id == selectedVariantId);
      if (variant && variant.length) {
        if (variant[0].available) {
          variantAvailableOnLoad = true;
        }
      }
    }
    else if(themeEditorShowVariantOnLoad != false){
	      // this means we have the first available variant selected and will select it.
	      variantAvailableOnLoad = true;
    }
    // create flag for if the variant is unavailable
    let shouldUnselectSwatchOptions = !variantAvailableOnLoad;
    let optionsToUnselect = [];     //['Color']  or   ['Size']  or  ['Color', 'Size', ] or  ['Color', 'Size']
    let colorIndex = 0;
    if (
      optionsToUnselect.includes(JSONData.options[0]) ||
      optionsToUnselect.includes(JSONData.options[1])
    ) {
      shouldUnselectSwatchOptions = shouldUnselectSwatchOptions && true;
      if (optionsToUnselect.includes(JSONData.options[1])) {
        colorIndex = 1;
      }
    } else {
      shouldUnselectSwatchOptions = false;
    }
    //shouldUnselectSwatchOptions = true;
    // if variant doesn't exist in the URL, then only unselect swatches
    if (shouldUnselectSwatchOptions) {
      unselectAllSwatchOptions(parent, colorIndex);
      reselectOtherOptions();
      // Hide the quantity box
      $('.product-quantity-box.purchase-details__quantity').hide();
      // disable the add to cart button
      $('.button--add-to-cart').attr('disabled', true);
      // change the text on the button
      $('.button--add-to-cart .text').text(Shopify.translation.unavailable);
      // remove the soldoout from all swatches
      $(`${parent} .swatch-element`).each(function (elem) {
        if (JSONData.options.length === 1) return;
        setTimeout(() => {
          $(this)
            .removeClass('soldout')
            .find(':radio')
            .removeAttr('disabled', 'disabled')
            .removeAttr('checked');
        }, 0);
      });
    } else {
      // if current selected variant is available, show the selected values
      let variant_ = JSONData.variants.find(
        (v) => v.id == (selectedVariantId || window.hwg_selected_id)
      );

      if (variant_ && variant_.available) {
        // this is the text stuff
        setTimeout(() => {
          $('.option-unavailable').show();
          $('.option-unavailable span').addClass('selected');
          const optn1 = $(`div[data-value="${variant_.option1}"]`);
          if (optn1 && optn1[0]) {
            optn1[0].click();
            const span = $($('.option-unavailable')[0]).find('span');
            span.text(variant_.option1);
            $('.option-unavailable :eq(0) span').text(variant_.option1);
          }
          if (variant_.option2) {
            const optn2 = $(`div[data-value="${variant_.option2}"]`);
            if (optn2 && optn2[0]) {
              optn2[0].click();
              const span = $($('.option-unavailable')[1]).find('span');
              span.text(variant_.option2);
            }
          }
        }, 10);
      }
    }
    function reselectOtherOptions() {
      // get both sets of swatches
      const swatches = document.querySelectorAll('.swatch');
      // go through each swatch set and if its not color option (sizes)
      // get the selected item and unselect it
      for (let swatch of swatches) {
        const isColorOption = swatch.dataset.optionIndex;
        if (isColorOption != 0) {
          const checkedInput = swatch.querySelector('input:checked');
          if (checkedInput) {
            checkedInput.checked = false;
            const label = document.getElementById(checkedInput.id);
            if (label) {
              setTimeout(() => {
                label.click();
              }, 1000);
            }
          }
        }
      }
    }
  });
  var productSection = '.product-' + productID + ' .js-product_section';
  var swatchOptions = $productForm.find('.swatch_options .swatch');
  // at the start of actual function outside of event listener
  // confirm that this is radio selector section
  enableProductSwatches();

  if (swatchOptions.length > 1) {
    linkOptionSelectors(JSONData, productSection);
  }

  if (!(JSONData && JSONData.options && JSONData.options.length)) {
    return;
  }

  if (JSONData && JSONData.variants && JSONData.variants.length === 1) {
    return;
  }

  var optionsMap = Shopify.optionsMap;
  if (JSONData.options.length === 1 && !optionsMap) {
    optionsMap = {};
    for (var i = 0; i < JSONData.variants.length; i++) {
      var variant = JSONData.variants[i];

      if (variant.available) {
        // Gathering values for the 1st drop-down.
        var key = variant.option1;
        optionsMap[key] = optionsMap[key] || [];
        optionsMap[key].push(variant.option1);
      }
    }
    setTimeout(function () {
      $(document).trigger('optionsMapAvailable');
    }, 500);
  }

  // hide all unavailable option when the page loads
  $('.option-unavailable').hide();

  function updateOptionsInSelector(selectorIndex, parent) {
    var selectorKey = selectorIndex === 0 ? 1 : 0;
    var firstSelection = $(
      '.swatch__options[data-variant-option-index="1"] .swatch__option input'
    )[0].value;
    var secondSelection = $(
      '.swatch__options[data-variant-option-index="0"] .swatch__option input'
    )[0].value;

    var temp =
      $('.swatch__options')[selectorIndex].dataset.variantOptionChosenValue;
    var key = temp != 'false' ? temp : firstSelection;

    temp = $('.swatch__options')[selectorKey].dataset.variantOptionChosenValue;
    var otherSelectedKey = temp != 'false' ? temp : secondSelection;
    let removeSoldoutClass = true;
    let availableOptions = [];
    if (selectorIndex === 0) {
      availableOptions = optionsMap[key];
      if (!availableOptions && JSONData.options.length === 1) {
        availableOptions = Object.keys(optionsMap);
        removeSoldoutClass = false;
      } else if (!availableOptions) {
        availableOptions = [];
      }
    } else if (selectorIndex === 1) {
      for (var k in optionsMap) {
        if (optionsMap[k].includes(key)) {
          availableOptions.push(k);
        }
      }
    }

    var currentSwatch = $(
      `${parent} .swatch[data-option-index=${selectorIndex}] .swatch-element[data-value='${key}']`
    );
    var currentSwatchValue = currentSwatch.data('value');

    // remove soldout from all swatch options
    if (JSONData.options.length > 1) {
      $(
        `${parent} .swatch[data-option-index=${selectorIndex}] .swatch-element`
      ).each(function () {
        setTimeout(() => {
          $(this).removeClass('soldout');
        }, 0);
      });
    }

    // if other swatch doesn't have the option available, remove the selection
    if (!availableOptions.includes(otherSelectedKey)) {
      unselectAllSwatchOptions(parent, selectorKey);
    }

    $('.option-unavailable[data-index=' + selectorIndex + ']').show();
    $('.option-unavailable[data-index=' + selectorIndex + '] span')
      .addClass('selected')
      .html(currentSwatchValue);

    // hide "choose one" text
    $(
      parent +
        ' .swatch[data-option-index="' +
        selectorKey +
        '"] .swatch-element'
    ).each(function () {
      const currentValue = $(this).attr('data-value');
      if (availableOptions.includes(currentValue)) {
        setTimeout(() => {
          $(this)
            .removeClass('soldout')
            .find(':radio')
            .removeAttr('disabled', 'disabled')
            .removeAttr('checked');
        }, 0);
      } else {
        setTimeout(() => {
          $(this).addClass('soldout');
        }, 0);
      }
    });
  }

  function unselectAllSwatchOptions(parent, selectorKey) {
    var ele = $(
      '.swatch_options .swatch[data-option-index="' + selectorKey + '"] input'
    );
    setTimeout(function () {
      for (var i = 0; i < ele.length; i++) {
        ele[i].checked = false;
        ele[i].disabled = false;
      }
      $('.swatch__options')[selectorKey].dataset.variantOptionChosenValue = '';
    }, 0);
    let choice = $(
      `.swatch_options .swatch[data-option-index="${selectorKey}"] .options-selection__option-name`
    ).data('variantOptionChooseName');
    $(
      `.swatch_options .swatch[data-option-index="${selectorKey}"] .options-selection__option-name`
    )
      .removeClass('selected')
      .html(choice);

      setTimeout(() => {
      
      //display prices when unavaialble variant is selected - am
      var saleClass = '';
      if ( productPriceCompare > productPrice) {
        var saleClass = 'sale';
        if (productPriceVaries === 'true') { 
          var comparePriceDetail = `
            <span class='3 compare-at-price ' style='margin-left: 5px;'>
              <span class='money'> ${priceCompareMinFormat} - ${priceCompareMaxFormat} </span>
            </span>`;
        } else {
          var comparePriceDetail = `
            <span class='4 compare-at-price ' style='margin-left: 5px;'>
              <span class='money'> ${priceCompareMinFormat}</span>
            </span>`;
        }
      } else {
        var comparePriceDetail = `<span class='5 compare-at-price'> </span>`;
      }

      if (productMinPrice.startsWith("$0.00")) {
        let showAmount = productMinPrice;
        showAmount = 'Free';
        var priceDetail = `<span class='6 sold_out'>${showAmount} </span>`;
      }

      if (productPriceVaries === 'true') {    // variants have varying prices
        var priceDetail = `
          <span class='1 sold_out ${saleClass}'>
            <span class='money'> ${priceMinFormat} - ${priceMaxFormat} </span> 
          </span>`;

      } else {
        var priceDetail = `
          <span class='2 sold_out ${saleClass}'>
            <span class='money'> ${priceFormat} </span> 
          </span>`;
      }
      // end price display setup - am

      $('.product-block--price .price-ui').empty();
      $('.product-block--price .price-ui').append(
         priceDetail + comparePriceDetail //"<span class='sold_out'>Make a selection</span>"
      );
    }, 0);
  }

  function enableProductSwatches() {
    // watch each of the radio buttons for changes
    $('body').on('change', '.swatch :radio', function () {
      // get the data for the selected radio
      var optionIndex = $(this).closest('.swatch').attr('data-option-index');
      var optionValue = $(this).val();
      var parentForm = $(this).closest('.product_form form');

      if (parentForm.siblings('.notify_form').length) {
        var notifyForm = parentForm.siblings('.notify_form');
      } else {
        var notifyForm = $('.js-notify-form');
      }
      // color of option1 and option2 and option3
      var option1 = parentForm
        .find('.swatch_options input:checked')
        .eq(0)
        .val();

      var option2 =
        parentForm.find('.swatch_options input:checked').eq(1).val() || '';
      var option3 =
        parentForm.find('.swatch_options input:checked').eq(2).val() || '';

      if (option1 && option2 && option3) {
        var notifyMessage = option1 + ' / ' + option2 + ' / ' + option3;
      } else if (option1 && option2) {
        var notifyMessage = option1 + ' / ' + option2;
      } else {
        var notifyMessage = option1;
      }

      notifyForm
        .find('.notify_form_message')
        .attr(
          'value',
          notifyForm.find('.notify_form_message').data('body') +
            ' - ' +
            notifyMessage
        );
      $(this)
        .closest('form')
        .find('.single-option-selector')
        .eq(optionIndex)
        .val(optionValue)
        .trigger('change');
    }); //Swatches linked with selected options
    // confirm that the product section exists
    if ($('.js-product_section').length) {
      var $productForms = $('.js-product_section').find('.product_form');
      $productForms.addClass('is-visible');
      //Loop through each product and set the initial option value state
      $productForms.each(function () {
        var JSONData = $(this).data('product');
        var productID = $(this).data('product-id');
        var productSection = '.product-' + productID + ' .js-product_section';
        var swatchOptions = $(this).find('.swatch_options .swatch');
        if (swatchOptions.length > 1) {
          linkOptionSelectorsInit(JSONData, productSection);
        }
      });
    } //Add click event when there is more than one product on the page (eg. Collection in Detail)

    if ($('.js-product_section').length > 1) {
      $('body').on('click', '.swatch-element', function () {
        var swatchValue = $(this).data('value').toString();
        $(this)
          .siblings('input[value="' + swatchValue.replace(/\"/g, '\\"') + '"]')
          .prop('checked', true)
          .trigger('change');
        var JSONData = $(this).parents('.product_form').data('product');
        var productID = $(this).parents('.product_form').data('product-id');
        var productSection = '.product-' + productID + ' .js-product_section';
        var swatchOptions = $(this)
          .parents('.product_form')
          .find('.swatch_options .swatch');

        if (swatchOptions.length > 1) {
          linkOptionSelectorsInit(JSONData, productSection);
        }
      });
    }
  }

  /*============================================================================
Swatch options - second and third swatch 'sold-out' will update based on availability of previous options selected
==============================================================================*/

  function updateOptionsInSelectorInit(selectorIndex, parent) {
    switch (selectorIndex) {
      case 0:
        var key = 'root';
        var selector = $(parent + ' .single-option-selector:eq(0)');
        break;

      case 1:
        var key = $('[data-option-index="1"] .swatch__options').data("variantOptionChosenValue") === false ? false : $('[data-option-index="1"] .swatch__options').data("variantOptionChosenValue");
        var selector = $(parent + ' .single-option-selector:eq(1)');
        break;

      case 2:
        var key = $(parent + ' .single-option-selector:eq(0)').val();
        key += ' / ' + $(parent + ' .single-option-selector:eq(1)').val();
        var selector = $(parent + ' .single-option-selector:eq(2)');
    }
    // use the optionsMap to opbtain available options
    var availableOptions = Shopify.optionsMap[key];
    console.log(key )
    // for each option,
    $(
      parent +
        ' .swatch[data-option-index="' +
        selectorIndex +
        '"] .swatch-element'
    ).each(function () {
      //if ($.inArray($(this).attr('data-value'), availableOptions) !== -1) {
        $(this)
          .removeClass('soldout')
          .find(':radio')
          .removeAttr('disabled', 'disabled')
          .removeAttr('checked');
      // } else {
      //   $(this)
      //     .addClass('soldout')
      //     .find(':radio')
      //     .removeAttr('checked')
      //     .attr('disabled', 'disabled');
      // }
    });
  }

  function linkOptionSelectorsInit(product, parent) {
    // Building our mapping object.
    Shopify.optionsMap = {};
    product.variants.forEach((variant) => {
      if (variant.available) {
        // Gathering values for the 1st drop-down.
        Shopify.optionsMap['root'] = Shopify.optionsMap['root'] || [];
        Shopify.optionsMap['root'].push(variant.option1);

        if (product.options.length > 1) {
          var key = variant.option1;
          Shopify.optionsMap[key] = Shopify.optionsMap[key] || [];
          Shopify.optionsMap[key].push(variant.option2);
        } // Gathering values for the 3rd drop-down.

        if (product.options.length === 3) {
          var key = variant.option1 + ' / ' + variant.option2;
          Shopify.optionsMap[key] = Shopify.optionsMap[key] || [];
          Shopify.optionsMap[key].push(variant.option3);
        }
      }
    });

    updateOptionsInSelectorInit(0, parent);
    console.log(product.options.length)
    if (product.options.length > 1) updateOptionsInSelectorInit(1, parent);
    if (product.options.length === 3) updateOptionsInSelectorInit(2, parent); // When there is an update in the first dropdown.

    $(parent + ' .single-option-selector:eq(0)').change(function () {
      updateOptionsInSelectorInit(1, parent);
      if (product.options.length === 3) updateOptionsInSelectorInit(2, parent);
      return true;
    }); // When there is an update in the second dropdown.

    $(parent + ' .single-option-selector:eq(1)').change(function () {
      if (product.options.length === 3) updateOptionsInSelectorInit(2, parent);
      return true;
    });
    //   <Raj addedOn={24 july 2021}>
    $(document).trigger('optionsMapAvailable');
  }
})();
