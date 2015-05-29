(function($) {
  $(document).ready(function() {
    var $baseColorsForm = $('#base-colors');
    var $fontForm       = $('#base-fonts');
    // Force num only on pixel value inputs
    $('.pixel-val, .rem-val').forceNumeric();

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

    // Click events
    $baseColorsForm.find('.update').on('click', function() {
      updateColorList();
      generateSwatches($baseColorsForm.find('.row'));
      generateVarList();
    });

    $('.color-val').on('keyup', function() {
      if ($(this).val().length === 3 || $(this).val().length === 6) {
        $(this).attr('style', '').css('background-color', '#' + $(this).val());
      }

      if ($(this).val().length === 0) {
        $(this).attr('style', '');
      }
    });

    $baseColorsForm.find('.add').on('click', function() {
      var $appendAfter = $baseColorsForm.find('.row:not(.no-append)').last();

      // TODO: Add clientside handlebars to handle templates
      var newRow = '';
      newRow    += '<div class="row">'
                +   '<input type="text" class="var-name" placeholder="Some other color">'
                +   '<input type="tel" placeholder="efefef" maxlength="6" class="color-val">'
                +  '</div>';

      $appendAfter.after(newRow);

    });

    $fontForm.find('.update').on('click', function() {
      generateFonts($fontForm.find('.row'));
      generateVarList();
    });

    $('#create-var-list').on('click', function() {
      generateVarList();
    });

  })
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