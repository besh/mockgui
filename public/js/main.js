(function($) {
  $(document).ready(function() {
    var $baseColorsForm = $('#base-colors');
    var $fontForm       = $('#base-fonts');
    var $toggleBtn      = $('.toggle-mode');
    var $siteSelect     = $('.selected-site-name');

    // Force num only on pixel value inputs
    $('.pixel-val, .rem-val').forceNumeric();

    // Check chrome storage on load
    chrome.storage.local.get(null, function (data) {
      console.info(data)
      if (isEmpty(data.site)) {
        console.log('no sites!')
        toggleMode('create');
      } else {
        toggleMode('edit');
        init(data);
      }
    });

    // init the sites
    function init(data) {
      var options = '';
      $.each(data.site, function(key) {
        options += '<option>' + key + '</option>';
      });

      $siteSelect.html(options);

      if (data && data.active) {
        setActiveSite(data.active);
      }
    }

    function setActiveSite() {
      chrome.storage.local.get(null, function (data) {
        var activeSite = data.active;

        // Select the option with the site that matches the "active" key in chrome storage
        $siteSelect.find('option').filter(function() {
          return $(this).text() === activeSite;
        }).prop('selected', true);

        // retrieve site data and fill inputs
        $.each(data.site[activeSite].colors, function(key, value) {
          $('input[name="' + key + '"]').val(value);

          // if an input is not found, assume it's not a base color and create a new template
          if (!$('input[name="' + key + '"]').length) {
            createTemplate($baseColorsForm, 'color', key, value);
          }
        });
      });
    }

    // TODO: Add clientside handlebars to handle templates. This is junk.
    function createTemplate(form, type, key, value) {
      var $appendAfter = form.find('.row:not(.no-append)').last();
      var newRow       = '';

      newRow += '<div class="row new">';

      if (typeof key !== 'undefined' && typeof value !== 'undefined') {
        newRow +=   '<input type="text" class="var-name" value="' + key + '">'
               +    '<input type="tel" value="' + value + '" maxlength="6" class="' + type + '-val">'
      } else {
        newRow +=   '<input type="text" class="var-name" placeholder="some new ' + type + '">'
               +    '<input type="tel" maxlength="6" class="' + type + '-val">'
      }
      newRow += '</div>';

      $appendAfter.after(newRow);
    }

    function toggleMode(string) {
      var $edit        = $('.edit-mode');
      var $create      = $('.new-site');
      var $createInput = $create.find('input');
      var text         = $toggleBtn.text();

      if (string === 'create') {
        $edit.removeClass('on');
        $create.addClass('on');
        $toggleBtn.text('Edit');
        $createInput.focus();
      } else if (string === 'edit') {
        $edit.addClass('on');
        $create.removeClass('on');
        $toggleBtn.text('Create');
        $createInput.blur();
      } else {
        $edit.toggleClass('on');
        $create.toggleClass('on')
        if (text === 'Edit') {
          $toggleBtn.text('Create');
          $createInput.focus();
        } else {
          $toggleBtn.text('Edit');
          $createInput.blur();
        }
      }
    }

    function updateColorList() {
      var options      = '';
      var $colorSelect = $('.color-select-val');

      $baseColorsForm.find('.var-name').each(function() {
        var $this = $(this);
        var label = $this.text() || $this.val();
        var val   = $this.next('.color-val').val();

        if (val === '' || typeof val === 'undefined') {
          options = options;
        } else {
          options += '<option value="' + label + '">' + label + '</option>';
        }

      });

      // $colorSelect.each(function() {
      //   var selected = $(this).val();
      //   $(this).attr('data-old-val', selected);
      // });

      $colorSelect.html(options);

      // $colorSelect.each(function() {
      //   $(this).filter(function(){
      //     // console.log(this.value)
      //     // console.log($(this).attr('data-old-val'))
      //     return this.value === $(this).attr('data-old-val');
      //   }).prop('selected', true);
      // });
    }

    function generateFonts(row) {
      var fonts = '';
      row.each(function() {
        var $this      = $(this);
        var label      = $this.find('.var-name').text() || $this.find('.var-name').val();
        var fontSize   = $this.find('.rem-val').val();
        var fontFamily = $this.find('.font-val').val();

        if (fontFamily && fontFamily.length) {
          $('.generated-gui').attr('style', '').css('font-family', fontFamily);
        }

        if (fontSize == '' || typeof fontSize == 'undefined') {
          fonts = fonts;
        } else {
          fonts += '<li style="font-size: ' + crappyRemConversion(fontSize) + '">' + label + '</li>';
        }
        $('.font-sizes').html(fonts);
      });
    }

    function generateSwatches(row) {
      var swatches = '';
      row.each(function() {
        var $this = $(this);
        var label = $this.find('.var-name').text() || $this.find('.var-name').val();
        var color = $this.find('.color-val').val();

        if (color === '' || typeof color === 'undefined') {
          swatches += '';
        } else {
          var fontColorClass = hexCheck(color);
          swatches += '<li style="background-color: #' + color + '" class="' + fontColorClass + '">' + label + '</li>';
        }
      });
      $('.swatch-list').html(swatches);
    }

    function isEmpty(obj) {
      for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          return false;
        }
      }
      return true;
    }

    function generateVarList() {
      var varList = '';

      $('form').each(function(i) {
        var $this = $(this);
        if (i > 0) {
          varList += String.fromCharCode(13);
        }
        varList += '// ' + $this.find('h2').text() + String.fromCharCode(13);
        $this.find('.row').each(function() {
          var $row      = $(this);
          var $varLabel = $row.find('.var-name');
          var $labelVar = $varLabel.text() || $varLabel.val();
          var $varInput = $row.find('[class*="-val"]');
          var $val      = $varInput.val();

          // TODO: Switch statement
          if ($val === '' || typeof $val === 'undefined' || $val === null) {
            varList = varList;
          } else {
            varList += makeVar($labelVar);
            varList += ' = ';
            if ($varInput.hasClass('color-val')) {
              varList += '#' + $val;
            } else if ($varInput.hasClass('pixel-val')) {
              if ($row.hasClass('border') && $row.find('.color-select-val').val()) {
                varList += $val + 'px';
                varList += ' solid ';
                varList += makeVar($row.find('.color-select-val').val());
              } else {
                varList += $val + 'px';
              }
            } else if ($varInput.hasClass('rem-val')) {
              varList += crappyRemConversion($val);
            } else if ($varInput.hasClass('color-select-val')) {
              varList += makeVar($val);
            } else {
              varList += $val;
            }

            varList += ';' + String.fromCharCode(13);

          }
        });
      });

      $('.var-list').text(varList);
    }

    function makeVar(string) {
      return '$' + string.replace(/ /, '-').toLowerCase();
    }

    function makeKey(string) {
      return string.replace(/ /, '_').toLowerCase();
    }

    // TODO: Better rem conversion
    function crappyRemConversion(string) {
      if (string.length > 1) {
        return string = string.substring(0, 1) + '.' + string.substring(1) + 'rem';
      } else {
        return string = '0.' + string + 'rem';
      }
    }

    // TODO: Better hex check for light vs dark colors. For now, this poorman's check will do
    function hexCheck(color) {
      var fontColorClass = 'light-color'
      if (color.charAt(0).match(/[a-f]/i)){
        fontColorClass = 'dark-color'
      }

      return fontColorClass;
    }

    //--------------------------------------------
    // Click events
    //--------------------------------------------
    $('.new-site-button').on('click', function() {
      var key = $('.new-site input').val();
      if (key !== '') {
        chrome.storage.local.get(null, function (data) {
          // Check if any sites have been created yet
          if (typeof data.site === 'undefined') {
            data.site = {};
          }

          // check if key exists already
          if (typeof data.site[key] !== 'undefined') {
            console.log('site already exists!')
          } else {
            // create the site
            data.site[key] = {};
          }

          // set active site to newly created site
          data.active = key;

          // Save data
          chrome.storage.local.set(data);
          init(data);
          setActiveSite(data.active);
        });

        toggleMode('edit');

      } else {
        console.log('enter site name to get started')
      }
    });

    $baseColorsForm.find('.update').on('click', function() {
      chrome.storage.local.get(null, function (data) {
        var active = data.active

        // If colors doesn't exist yet, create it
        if (typeof data.site[active].colors === 'undefined') {
          data.site[active].colors = {};
        }

        // Find any new color vals and save them to chrome storage
        $baseColorsForm.find('.new').each(function() {
          var $this = $(this);
          var key   = $this.find('.var-name').val() || $this.find('.var-name').text();
          var val   = $this.find('.color-val').val();

          data.site[active].colors[key] = val;
          chrome.storage.local.set(data);
          $this.removeClass('new');
        });
      });

      updateColorList();
      generateSwatches($baseColorsForm.find('.row'));
      generateVarList();
    });

    $('.color-val').on('keyup', function() {
      var $this = $(this);

      if (!$this.parent('.row').hasClass('new')) {
        $this.parent('.row').addClass('new');
      }
      if ($this.val().length === 3 || $this.val().length === 6) {
        $this.attr('style', '').css('background-color', '#' + $this.val());
      }

      if ($this.val().length === 0) {
        $this.attr('style', '');
      }
    });

    $baseColorsForm.find('.add').on('click', function() {
      createTemplate($baseColorsForm, 'color');
    });

    $fontForm.find('.update').on('click', function() {
      generateFonts($fontForm.find('.row'));
      generateVarList();
    });

    $('#create-var-list').on('click', function() {
      generateVarList();
    });

    // Toggle the mode between create and editing
    $toggleBtn.on('click', function() {
      toggleMode();
    })

    $siteSelect.on('change', function() {
      // Define val outside of get call to avoid scope issues
      var val = $(this).val();

      // Save selected site to chrome storage
      chrome.storage.local.get(null, function (data) {
        data.active = val;
        chrome.storage.local.set(data);
        setActiveSite(data.active);
      });
    });

  })
})(jQuery);

var objTemplate = {
  "colors": {
    "primary_color" : "efefef",
    "secondary_color" : "000"
  },
  "font_family": "helvetica",
  "font_sizes": {
    "small": '1rem',
    "regular": '1.3rem'
  },
  "form_fields": {
    "color": "seondary",
    "border": {
      "color": "primary",
      "size": "1px"
    }
  }
}

// forceNumeric() plug-in implementation
jQuery.fn.forceNumeric = function () {
  return this.each(function () {
    $(this).keydown(function (e) {
      var key = e.which || e.keyCode;
      if (!e.shiftKey && !e.altKey && !e.ctrlKey &&
        // numbers
        key >= 48 && key <= 57 ||
        // Numeric keypad
        key >= 96 && key <= 105 ||
        // comma, period and minus, . on keypad
        key == 190 || key == 188 || key == 109 || key == 110 ||
        // Backspace and Tab and Enter
        key == 8 || key == 9 || key == 13 ||
        // Home and End
        key == 35 || key == 36 ||
        // left and right arrows
        key == 37 || key == 39 ||
        // Del and Ins
        key == 46 || key == 45) {
          return true;
      }
      return false;
    });
  });
}