jQuery(document).ready(function ($) {
  //get url param
  var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1),
      sURLVariables = sPageURL.split("&"),
      sParameterName,
      i;

    for (i = 0; i < sURLVariables.length; i++) {
      sParameterName = sURLVariables[i].split("=");

      if (sParameterName[0] === sParam) {
        return sParameterName[1] === undefined
          ? true
          : decodeURIComponent(sParameterName[1]);
      }
    }
    return false;
  };

  /*
This helper function makes a group of elements animate along the x-axis in a seamless, responsive loop.

Features:
- Uses xPercent so that even if the widths change (like if the window gets resized), it should still work in most cases.
- When each item animates to the left or right enough, it will loop back to the other side
- Optionally pass in a config object with values like "speed" (default: 1, which travels at roughly 100 pixels per second), paused (boolean),  repeat, reversed, and paddingRight.
- The returned timeline will have the following methods added to it:
- next() - animates to the next element using a timeline.tweenTo() which it returns. You can pass in a vars object to control duration, easing, etc.
- previous() - animates to the previous element using a timeline.tweenTo() which it returns. You can pass in a vars object to control duration, easing, etc.
- toIndex() - pass in a zero-based index value of the element that it should animate to, and optionally pass in a vars object to control duration, easing, etc. Always goes in the shortest direction
- current() - returns the current index (if an animation is in-progress, it reflects the final index)
- times - an Array of the times on the timeline where each element hits the "starting" spot. There's also a label added accordingly, so "label1" is when the 2nd element reaches the start.
*/
  function horizontalLoop(items, config) {
    items = gsap.utils.toArray(items);
    config = config || {};
    let tl = gsap.timeline({
        repeat: config.repeat,
        paused: config.paused,
        defaults: { ease: "none" },
        onReverseComplete: () =>
          tl.totalTime(tl.rawTime() + tl.duration() * 100),
      }),
      length = items.length,
      startX = items[0].offsetLeft,
      times = [],
      widths = [],
      xPercents = [],
      curIndex = 0,
      pixelsPerSecond = (config.speed || 1) * 100,
      snap =
        config.snap === false ? (v) => v : gsap.utils.snap(config.snap || 1), // some browsers shift by a pixel to accommodate flex layouts, so for example if width is 20% the first element's width might be 242px, and the next 243px, alternating back and forth. So we snap to 5 percentage points to make things look more natural
      totalWidth,
      curX,
      distanceToStart,
      distanceToLoop,
      item,
      i;
    gsap.set(items, {
      // convert "x" to "xPercent" to make things responsive, and populate the widths/xPercents Arrays to make lookups faster.
      xPercent: (i, el) => {
        let w = (widths[i] = parseFloat(gsap.getProperty(el, "width", "px")));
        xPercents[i] = snap(
          (parseFloat(gsap.getProperty(el, "x", "px")) / w) * 100 +
            gsap.getProperty(el, "xPercent")
        );
        return xPercents[i];
      },
    });
    gsap.set(items, { x: 0 });
    totalWidth =
      items[length - 1].offsetLeft +
      (xPercents[length - 1] / 100) * widths[length - 1] -
      startX +
      items[length - 1].offsetWidth *
        gsap.getProperty(items[length - 1], "scaleX") +
      (parseFloat(config.paddingRight) || 0);
    for (i = 0; i < length; i++) {
      item = items[i];
      curX = (xPercents[i] / 100) * widths[i];
      distanceToStart = item.offsetLeft + curX - startX;
      distanceToLoop =
        distanceToStart + widths[i] * gsap.getProperty(item, "scaleX");
      tl.to(
        item,
        {
          xPercent: snap(((curX - distanceToLoop) / widths[i]) * 100),
          duration: distanceToLoop / pixelsPerSecond,
        },
        0
      )
        .fromTo(
          item,
          {
            xPercent: snap(
              ((curX - distanceToLoop + totalWidth) / widths[i]) * 100
            ),
          },
          {
            xPercent: xPercents[i],
            duration:
              (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond,
            immediateRender: false,
          },
          distanceToLoop / pixelsPerSecond
        )
        .add("label" + i, distanceToStart / pixelsPerSecond);
      times[i] = distanceToStart / pixelsPerSecond;
    }
    function toIndex(index, vars) {
      vars = vars || {};
      Math.abs(index - curIndex) > length / 2 &&
        (index += index > curIndex ? -length : length); // always go in the shortest direction
      let newIndex = gsap.utils.wrap(0, length, index),
        time = times[newIndex];
      if (time > tl.time() !== index > curIndex) {
        // if we're wrapping the timeline's playhead, make the proper adjustments
        vars.modifiers = { time: gsap.utils.wrap(0, tl.duration()) };
        time += tl.duration() * (index > curIndex ? 1 : -1);
      }
      curIndex = newIndex;
      vars.overwrite = true;
      return tl.tweenTo(time, vars);
    }
    tl.next = (vars) => toIndex(curIndex + 1, vars);
    tl.previous = (vars) => toIndex(curIndex - 1, vars);
    tl.current = () => curIndex;
    tl.toIndex = (index, vars) => toIndex(index, vars);
    tl.times = times;
    tl.progress(1, true).progress(0, true); // pre-render for performance
    if (config.reversed) {
      tl.vars.onReverseComplete();
      tl.reverse();
    }
    return tl;
  }

  //check if mobile device
  var isMobile = false; //initiate as false
  // device detection
  if (
    /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(
      navigator.userAgent
    ) ||
    /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
      navigator.userAgent.substr(0, 4)
    )
  ) {
    isMobile = true;
  }

  // open sidemenu
  $(".burger").click(function () {
    $(this).toggleClass("open");
    $(".sidemenu").toggleClass("open");
    $("body").toggleClass("lock");
  });

  // dropdown
  $(".dropdown-toggle").click(function (e) {
    e.preventDefault();
    $(this).siblings(".dropdown-menu").slideToggle();
    $(this).toggleClass("rotate-caret");
  });

  // Initialize animate on scroll
  AOS.init({ duration: 400, easing: "ease-out" });

  //Timeline
  var items = $(".timeline__item");

  //activate timeline item
  var numbers = $(".timeline__item");
  for (let i = 0; i < numbers.length; i++) {
    items[i].classList.add("tooltip-active");
  }

  //read more toggle
  $(".read-more-link").click(function (e) {
    e.preventDefault();
    let readMore = $(this).parent().find(".read-more-toggle");
    var readMoreButton = $(this);
    readMore.slideToggle();
    readMoreButton.toggleClass("less");
    let classList = readMoreButton.attr("class");
    if (classList.includes("less")) {
      readMoreButton.text("Read Less");
    } else {
      readMoreButton.text("Read More");
    }
  });

  //partners slider
  const wrapper = document.querySelector(".slider-wrapper");
  if (wrapper) {
    // Create array of elements to tween on
    const boxes = gsap.utils.toArray(".slider-box");

    // Setup the tween
    const loop = horizontalLoop(boxes, {
      paused: true, // Sets the tween to be paused initially
      repeat: -1, // Makes sure the tween runs infinitely
    });

    // Start the tween
    loop.play(); // Call to start playing the tween
  }

  //package selection
  var package = getUrlParameter("package");
  var solar = [
    "Marketing Strategy",
    "Social Media Management",
    "Community Management",
    "Design",
  ];
  var galaxy = [
    "Marketing Strategy",
    "Social Media Management",
    "Community Management",
    "Design",
    "Influencer Marketing",
  ];
  var interstellar = [
    "Marketing Strategy",
    "Social Media Management",
    "Community Management",
    "Design",
    "Influencer Marketing",
    "Web3 Consulting",
    "Crypto PR",
  ];
  var options = $("input[type='checkbox']");
  for (let i = 0; i < options.length; i++) {
    var defValue = options[i].defaultValue;
    if (package) {
      switch (package) {
        case "solar":
          if (solar.includes(defValue)) {
            options[i].checked = true;
          }
          break;
        case "galaxy":
          if (galaxy.includes(defValue) == true) {
            options[i].checked = true;
          }
          break;
        case "interstellar":
          if (interstellar.includes(defValue) == true) {
            options[i].checked = true;
          }
          break;
      }
      options[i].disabled = true;
    }
  }

  //mobile specific
  if (isMobile === true) {
    $(".box-item").click(function (e) {
      $(this).toggleClass("flip-box-clicked");
    });
    //add spacing to mobile <br> tag
    $('<span class="mobile-space"></span>').insertBefore($("br"));

    //remove focus box on touch for all buttons
    $(".elementor-button").each(function () {
      $(this).addClass("noSelect");
    });
    $(".elementor-widget-theme-site-logo.elementor-widget-image a").addClass(
      "noSelect"
    );
  } else {
    //service bottom cards hover func
    $(".box-item").hover(
      function () {
        $(this).toggleClass("flip-box-clicked");
      },
      function () {
        $(this).toggleClass("flip-box-clicked");
      }
    );
  }

  //twitter links for case study tweets slider/iframe
  //todo: is this really the best way to do this?

  //get case study from url
  const href = window.location.href;
  const segments = new URL(href).pathname.split("/");
  const lastSegment = segments.pop() || segments.pop();

  //url collection - probably messy should change approach
  const caseStudies = [
    [
      "occam-fi",
      [
        "https://twitter.com/OccamFi/status/1434243944695615491?t=JotW07dY01AinvmHCeoA8g&s=19",
        "https://twitter.com/OccamFi/status/1455632006658801664?t=TeZRiwx1wh8J6Dqu9MKAoA&s=19",
        "https://twitter.com/OccamFi/status/1441023163064885249?s=19",
        "https://x.com/DeFIRE_Fi/status/1405491291488768001?t=U-uRe9XOul-op-b__lXPTg&s=35",
        "https://x.com/DeFIRE_Fi/status/1427340364617293832?t=nv6ulE5Z8rh3xl4KShJjQA&s=35",
        "https://x.com/DeFIRE_Fi/status/1417142709488324609?t=9zXVyi6rYfHOdk7aE28PZg&s=35",
        "https://x.com/DeFIRE_Fi/status/1442802506040582149?t=5MSlt3N9k8_Tmz9NdYziLA&s=35",
        "https://x.com/Arenum_official/status/1469588377989226500?s=20",
        "https://x.com/Arenum_official/status/1471502613937999874?s=20",
        "https://x.com/Arenum_official/status/1473389505835147270?s=20",
        "https://x.com/Arenum_official/status/1479481866071810048?s=20",
        "https://x.com/Arenum_official/status/1481576804712386560?s=20",
        "https://x.com/Arenum_official/status/1482279173532094464?s=20",
        "https://x.com/Colizeumcom/status/1450014456176594948?s=20",
        "https://twitter.com/DuelistKingNFT/status/1443586398062211072",
        "https://x.com/DuelistKingNFT/status/1447612894854647808?s=20",
        "https://x.com/DuelistKingNFT/status/1449322742331805696?s=20",
      ],
    ],

    [
      "blueshift-fi",
      [
        "https://twitter.com/blueshiftfi/status/1494240459157348355?t=ChUEkGXUDm9hDVRgADFTWw&s=19",
        "https://twitter.com/blueshiftfi/status/1509984432400343040?t=oYTyUkzlNj_cFZL0n5dyWA&s=19",
        "https://twitter.com/blueshiftfi/status/1511368654822256641?t=qykfQxULXGyczyOA5_52Uw&s=19",
        "https://twitter.com/blueshiftfi/status/1511239432631898115?t=0_zjk_1brbnpm941XNjwSA&s=19",
        "https://twitter.com/blueshiftfi/status/1513975337805299718?t=a8VfgnsOC6msPDEeZqhBYA&s=19",
        "https://twitter.com/blueshiftfi/status/1514555542953500672?t=3gIMF5Ds1xNNyJxL14ulrw&s=19",
        "https://twitter.com/blueshiftfi/status/1516431680336191490?t=j47Mg6uR8H3dW47t92Gn4A&s=19",
        "https://twitter.com/blueshiftfi/status/1524328057062014977?t=JNmfRDmbSeukdodw96H7VQ&s=19",
        "https://x.com/blueshiftfi/status/1524728371229437953?s=20",
        "https://twitter.com/blueshiftfi/status/1525112959646765056?t=HyHZ_qNmPFDkHYIPoyUP5g&s=19",
        "https://twitter.com/blueshiftfi/status/1529425624011767808?t=UmEFMbpxtwDpaDl3DrwvrQ&s=19",
        "https://twitter.com/blueshiftfi/status/1537775770881384448?t=esf8WmdLgdOc5y5eP7Ixcg&s=19",
        "https://twitter.com/blueshiftfi/status/1539255366957125634?t=TOlrACkqP-YzIOuTHWioKw&s=19",
        "https://x.com/blueshiftfi/status/1545127054823378945?s=20",
        "https://twitter.com/blueshiftfi/status/1547329203695230977?t=n1wW5AxgvfrPGgPGiwfQ9A&s=19",
      ],
    ],
    [
      "dhealth-network",
      [
        "https://twitter.com/dHealth_Network/status/1446414433488625664?t=NiOz8OpiWdbNjcg05pY5_g&s=19",
        "https://twitter.com/dHealth_Network/status/1454738634578481153?t=ZzAQSY-10cM5hvmLsUKQcg&s=19",
        "https://twitter.com/dHealth_Network/status/1455905528048144385?t=vr_S4C1Zpy29KmnFNmV0QA&s=19",
        "https://twitter.com/dHealth_Network/status/1456181894383644674?t=Mb_k1TnavHjoj6kbOKHogA&s=19",
        "https://twitter.com/cardano_daily/status/1456638411477962756?t=EBYh38rruyNWB0A3AL5AQg&s=19",
        "https://twitter.com/dHealth_Network/status/1460195420295122952?t=KdijT-MdbxCVqMqcMThdbA&s=19",
        "https://twitter.com/dHealth_Network/status/1462739187485052933?t=6j5BwR9RkEhsfwbGShBNig&s=19",
        "https://twitter.com/dHealth_Network/status/1463835962342100994?t=Cuf59-mzEMUXv2ydPR5xvQ&s=19",
        "https://twitter.com/dHealth_Network/status/1468163028181037063?t=S5ZgLtS7bWugHAs8Vhn-Nw&s=19",
        "https://twitter.com/dHealth_Network/status/1469708493879980038?t=BFWFJxHcW-og7GhDTAEF8A&s=19",
        "https://twitter.com/dHealth_Network/status/1482003136264953859?t=jtRZTTqAxhmFs0jSeT_rRg&s=19",
        "https://twitter.com/dHealth_Network/status/1472946595750686727?t=o-OlCqR0CQk2e6a5O3I1bg&s=19",
      ],
    ],
  ];

  //create an array of twitter links for current case study
  const twitterLinks = [];
  caseStudies.forEach(function (caseStudy) {
    if (caseStudy[0] == lastSegment) {
      caseStudy[1].forEach(function (index) {
        twitterLinks.push(index);
      });
    }
  });

  var existCondition = setInterval(function () {
    if ($("iframe").length) {
      clearInterval(existCondition);
      //initiate splide
      var splide = new Splide(".splide", {
        type: "slide",
        perPage: 3,
        lazyload: true,
        arrows: false,
        gap: 15,
        drag: true,
        snap: true,
        pagination: true,
        breakpoints: {
          768: {
            perPage: 2,
          },
          450: {
            perPage: 1,
          },
        },
      });
      splide.mount();

      //wrap splide slides with links
      $(".splide__slide > a").each(function (splide) {
        $(this).attr("href", twitterLinks[splide]);
      });
    }
  }, 500); // check every 500ms
});
