(function($) {
  $(document).ready(function() {
    var $baseColorsForm = $('#base-colors');
    var $fontForm       = $('#base-fonts');
    var $btnInputsForm  = $('#buttons-inputs-form');
    var $toggleBtn      = $('.toggle-mode');
    var $siteSelect     = $('.selected-site-name');
    var $colorSelect    = $('.color-select-val');
    var $update         = $('.update');

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

        $('input[class*="-val"]').val('');
        $('.row.custom').remove();

        // retrieve site data and fill inputs
        if (data.site[activeSite].colors) {
          $.each(data.site[activeSite].colors, function(key, value) {
            $('input[name="' + key + '"]').val(value);

            // if an input is not found, assume it's not a base color and create a new template
            if (!$('input[name="' + key + '"]').length) {
              createTemplate($baseColorsForm, 'color', key, value);
            }
          });
        }

        // TODO: Super redundant. Iterate through keys under the active site and pass root key down the chain
        if (data.site[activeSite].fonts) {
          $.each(data.site[activeSite].fonts, function(key, value) {
            $('input[name="' + key + '"]').val(value);
          });
        }

        if (data.site[activeSite].buttons_inputs) {
          $.each(data.site[activeSite].buttons_inputs, function(key, value) {
            $('input[name="' + key + '"]').val(value);
          });
        }
        $update.trigger('click');

      });
    }

    // TODO: Add clientside handlebars to handle templates. This is junk.
    function createTemplate(form, type, key, value) {
      var $appendAfter = form.find('.row:not(.no-append)').last();
      var newRow       = '';

      newRow += '<div class="row new custom">';

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
      var $siteSelect  = $('.selected-site-name');

      if (string === 'create') {
        $edit.removeClass('on');
        $create.addClass('on');
        $toggleBtn.text('Edit');
        $siteSelect.hide();

      } else if (string === 'edit') {
        $edit.addClass('on');
        $create.removeClass('on');
        $toggleBtn.text('Create');
        $siteSelect.addClass('on');
      } else {
        $edit.toggleClass('on');
        $create.toggleClass('on');
        $siteSelect.toggleClass('on');
        if (text === 'Edit') {
          $toggleBtn.text('Create');
        } else {
          $toggleBtn.text('Edit');
        }
      }
    }

    function updateColorList() {
      chrome.storage.local.get(null, function (data) {
        var activeSite = data.active;
        var options = '';
        if (data.site[activeSite].colors) {
          options += '<option value="">None</option>';
          $.each(data.site[activeSite].colors, function(key, value) {
            if (key !== '' && value !== '') {
              options += '<option value="' + key + '">' + key + '</option>';
            }
          });
          $colorSelect.html(options);

          // TODO : more redundancy
          // Update color select boxes with active selected color
          $.each(data.site[activeSite].fonts, function(key, value) {
            $('select[name="' + key + '"]').find('option').filter(function() {
              return $(this).text() === value;
            }).prop('selected', true);
          });

          $.each(data.site[activeSite].buttons_inputs, function(key, value) {
            $('select[name="' + key + '"]').find('option').filter(function() {
              return $(this).text() === value;
            }).prop('selected', true);
          });
        }
      });
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

    $update.on('click', function() {
      chrome.storage.local.get(null, function (data) {
        var active = data.active

        // If colors doesn't exist yet, create it
        if (typeof data.site[active].colors === 'undefined') {
          data.site[active].colors = {};
        }

        if (typeof data.site[active].fonts === 'undefined') {
          data.site[active].fonts = {};
        }

        if (typeof data.site[active].buttons_inputs === 'undefined') {
          data.site[active].buttons_inputs = {};
        }

        // TODO: Super redundant. These three chunks can be simplified
        // Find any new color vals and save them to chrome storage
        $baseColorsForm.find('.new').each(function() {
          var $this = $(this);
          var key   = $this.find('.var-name').val() || $this.find('.var-name').text();
          var val   = $this.find('.color-val').val();

          data.site[active].colors[key] = val;

          if (val === '') {
            delete data.site[active].colors[key]
          }

          // chrome.storage.local.set(data);
          $this.removeClass('new');
        });

        $fontForm.find('.new').each(function() {
          var $this = $(this);
          var key   = $this.find('.var-name').val() || $this.find('.var-name').text();
          var val   = $this.find('[class*="-val"]').val();

          data.site[active].fonts[key] = val;
          // chrome.storage.local.set(data);
          $this.removeClass('new');
        });

        $btnInputsForm.find('.new').each(function() {
          var $this = $(this);

          $this.find('[class*="-val"]').each(function() {
            var $el   = $(this);
            var key   = $el.attr('name');
            var val   = $el.val();
            data.site[active].buttons_inputs[key] = val;
          });

          $this.removeClass('new');
        });
        console.log(data)
        chrome.storage.local.set(data);
        $('.generated-gui').addClass('on');
        updateColorList();
        generateSwatches($baseColorsForm.find('.row'));
        generateFonts($fontForm.find('.row'));
        generateVarList();

      });
    });

    $(document).on('keyup', '.color-val, .rem-val, .font-val', function() {
      var $this = $(this);

      $update.removeClass('disabled');

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

    $colorSelect.on('change', function() {
      var $this = $(this);

      $update.removeClass('disabled');

      if (!$this.parent('.row').hasClass('new')) {
        $this.parent('.row').addClass('new');
      }
    });

    $baseColorsForm.find('.add').on('click', function() {
      createTemplate($baseColorsForm, 'color');
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

    $('.toggle-output, .output .close-btn, .output .background').on('click', function() {
      $('.output').toggleClass('on');
    });

  });

})(jQuery);

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

