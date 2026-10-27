/*
  Поведение макета Koala Clash. Всё, что в клиенте делает React, здесь сделано руками:
  переходы по страницам, кнопка подключения, выбор серверов, меню, тосты, диалоги.
  Снаружи (из конструктора) макетом управляют через window.KT - см. конец файла.
*/
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const html = document.documentElement;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const listeners = new Set();
  const emit = (type, value) => listeners.forEach((fn) => { try { fn({ type, value }); } catch (e) { /* конструктор закрыт */ } });

  /* ---------- Иконки боковой панели (components/icons/sidebar-icons.tsx) ---------- */
  const NAV_ICONS = {
    home: ["0 0 20 20","M10.8498 0.334017C10.3692 -0.111339 9.62689 -0.111339 9.15024 0.334017L0.398713 8.45981C0.0236475 8.81141 -0.101374 9.35443 0.0861584 9.83104C0.273691 10.3076 0.730802 10.6241 1.24652 10.6241H1.87163V17.4998C1.87163 18.8788 2.99292 20 4.37206 20H15.624C17.0032 20 18.1245 18.8788 18.1245 17.4998V10.6241H18.7496C19.2653 10.6241 19.7263 10.3076 19.9138 9.83104C20.1014 9.35443 19.9764 8.8075 19.6013 8.45981L10.8498 0.334017ZM9.37294 12.4993H10.6232C11.6585 12.4993 12.4985 13.3392 12.4985 14.3745V18.1248H7.49761V14.3745C7.49761 13.3392 8.3376 12.4993 9.37294 12.4993Z"],
    profiles: ["0 0 21 20","M3 4.125C3 3.03098 3.4346 1.98177 4.20818 1.20818C4.98177 0.434597 6.03098 0 7.125 0C8.21902 0 9.26823 0.434597 10.0418 1.20818C10.8154 1.98177 11.25 3.03098 11.25 4.125C11.25 5.21902 10.8154 6.26823 10.0418 7.04182C9.26823 7.8154 8.21902 8.25 7.125 8.25C6.03098 8.25 4.98177 7.8154 4.20818 7.04182C3.4346 6.26823 3 5.21902 3 4.125ZM12.75 6.375C12.75 5.93179 12.8373 5.49292 13.0069 5.08344C13.1765 4.67397 13.4251 4.30191 13.7385 3.98851C14.0519 3.67512 14.424 3.42652 14.8334 3.25691C15.2429 3.0873 15.6818 3 16.125 3C16.5682 3 17.0071 3.0873 17.4166 3.25691C17.826 3.42652 18.1981 3.67512 18.5115 3.98851C18.8249 4.30191 19.0735 4.67397 19.2431 5.08344C19.4127 5.49292 19.5 5.93179 19.5 6.375C19.5 7.27011 19.1444 8.12855 18.5115 8.76149C17.8786 9.39442 17.0201 9.75 16.125 9.75C15.2299 9.75 14.3715 9.39442 13.7385 8.76149C13.1056 8.12855 12.75 7.27011 12.75 6.375ZM0 16.875C2.81582e-08 14.9853 0.750668 13.1731 2.08686 11.8369C3.42306 10.5007 5.23533 9.75 7.125 9.75C9.01467 9.75 10.8269 10.5007 12.1631 11.8369C13.4993 13.1731 14.25 14.9853 14.25 16.875V16.878L14.249 16.997C14.2469 17.1242 14.2125 17.2487 14.1489 17.3589C14.0854 17.4691 13.995 17.5614 13.886 17.627C11.8451 18.8558 9.50725 19.5035 7.125 19.5C4.653 19.5 2.339 18.816 0.365 17.627C0.255851 17.5615 0.165167 17.4693 0.101487 17.3591C0.0378062 17.2489 0.00322534 17.1243 0.00100005 16.997L0 16.875ZM15.75 16.878L15.749 17.022C15.7434 17.3553 15.6638 17.6832 15.516 17.982C15.7173 17.994 15.9203 18 16.125 18C17.721 18 19.232 17.63 20.576 16.971C20.6973 16.9117 20.8004 16.8208 20.8743 16.7078C20.9482 16.5948 20.9903 16.4639 20.996 16.329L21 16.125C21.0001 15.3028 20.7923 14.494 20.3959 13.7737C19.9995 13.0534 19.4274 12.445 18.7327 12.0052C18.038 11.5654 17.2434 11.3085 16.4228 11.2583C15.6021 11.208 14.7821 11.3662 14.039 11.718C15.1513 13.2071 15.7512 15.0164 15.749 16.875L15.75 16.878Z"],
    proxies: ["0 0 20 16","M0 1.89091C0 0.976485 0.677949 0 1.79487 0H18.2051C19.3221 0 20 0.976485 20 1.89091V5.38182C20 6.29624 19.3221 7.27273 18.2051 7.27273H1.79487C0.677949 7.27273 0 6.29624 0 5.38182V1.89091ZM3.84615 2.90909C3.64214 2.90909 3.44648 2.98571 3.30223 3.1221C3.15797 3.25849 3.07692 3.44348 3.07692 3.63636C3.07692 3.82925 3.15797 4.01423 3.30223 4.15062C3.44648 4.28701 3.64214 4.36364 3.84615 4.36364H5.89744C6.10145 4.36364 6.29711 4.28701 6.44136 4.15062C6.58562 4.01423 6.66667 3.82925 6.66667 3.63636C6.66667 3.44348 6.58562 3.25849 6.44136 3.1221C6.29711 2.98571 6.10145 2.90909 5.89744 2.90909H3.84615ZM0 10.6182C0 9.70376 0.677949 8.72727 1.79487 8.72727H18.2051C19.3221 8.72727 20 9.70376 20 10.6182V14.1091C20 15.0235 19.3221 16 18.2051 16H1.79487C0.677949 16 0 15.0235 0 14.1091V10.6182ZM3.84615 11.6364C3.64214 11.6364 3.44648 11.713 3.30223 11.8494C3.15797 11.9858 3.07692 12.1708 3.07692 12.3636C3.07692 12.5565 3.15797 12.7415 3.30223 12.8779C3.44648 13.0143 3.64214 13.0909 3.84615 13.0909H5.89744C6.10145 13.0909 6.29711 13.0143 6.44136 12.8779C6.58562 12.7415 6.66667 12.5565 6.66667 12.3636C6.66667 12.1708 6.58562 11.9858 6.44136 11.8494C6.29711 11.713 6.10145 11.6364 5.89744 11.6364H3.84615Z"],
    connections: ["0 0 20 20","M18.8679 5.8216C19.6226 6.57277 19.6226 7.79343 18.8679 8.4507L16.2264 11.0798L8.86792 3.75587L11.5094 1.12676C12.2642 0.375587 13.4906 0.375587 14.1509 1.12676L15.8491 2.8169L18.6792 0L20 1.31455L17.1698 4.13145L18.8679 5.8216ZM13.3962 11.2676L12.0755 9.95305L9.43396 12.5822L7.45283 10.6103L10.0943 7.98122L8.77359 6.66667L6.13208 9.29577L4.71698 7.98122L2.07547 10.6103C1.32075 11.3615 1.32075 12.5822 2.07547 13.2394L3.77358 14.9296L0 18.6854L1.32075 20L5.09434 16.2441L6.79245 17.9343C7.54717 18.6854 8.77358 18.6854 9.43396 17.9343L12.0755 15.3052L10.7547 13.9906L13.3962 11.2676Z"],
    rules: ["0 0 20 16","M18 2H10L8 0H2C0.9 0 0.00999999 0.9 0.00999999 2L0 14C0 15.1 0.9 16 2 16H18C19.1 16 20 15.1 20 14V4C20 2.9 19.1 2 18 2ZM5.83 12L3 9.17L4.41 7.76L5.82 9.17L9.36 5.63L10.77 7.04L5.83 12ZM15.41 9L17 10.59L15.59 12L14 10.41L12.41 12L11 10.59L12.59 9L11 7.41L12.41 6L14 7.59L15.59 6L17 7.41L15.41 9Z"],
    logs: ["0 0 20 20","M5.55556 15.5556C5.87037 15.5556 6.13444 15.4489 6.34778 15.2356C6.56111 15.0222 6.66741 14.7585 6.66667 14.4444C6.66593 14.1304 6.55926 13.8667 6.34667 13.6533C6.13407 13.44 5.87037 13.3333 5.55556 13.3333C5.24074 13.3333 4.97704 13.44 4.76444 13.6533C4.55185 13.8667 4.44518 14.1304 4.44444 14.4444C4.4437 14.7585 4.55037 15.0226 4.76444 15.2367C4.97852 15.4507 5.24222 15.557 5.55556 15.5556ZM5.55556 11.1111C5.87037 11.1111 6.13444 11.0044 6.34778 10.7911C6.56111 10.5778 6.66741 10.3141 6.66667 10C6.66593 9.68593 6.55926 9.42222 6.34667 9.20889C6.13407 8.99555 5.87037 8.88889 5.55556 8.88889C5.24074 8.88889 4.97704 8.99555 4.76444 9.20889C4.55185 9.42222 4.44518 9.68593 4.44444 10C4.4437 10.3141 4.55037 10.5781 4.76444 10.7922C4.97852 11.0063 5.24222 11.1126 5.55556 11.1111ZM5.55556 6.66667C5.87037 6.66667 6.13444 6.56 6.34778 6.34667C6.56111 6.13333 6.66741 5.86963 6.66667 5.55556C6.66593 5.24148 6.55926 4.97778 6.34667 4.76444C6.13407 4.55111 5.87037 4.44444 5.55556 4.44444C5.24074 4.44444 4.97704 4.55111 4.76444 4.76444C4.55185 4.97778 4.44518 5.24148 4.44444 5.55556C4.4437 5.86963 4.55037 6.1337 4.76444 6.34778C4.97852 6.56185 5.24222 6.66815 5.55556 6.66667ZM10 15.5556H14.4444C14.7593 15.5556 15.0233 15.4489 15.2367 15.2356C15.45 15.0222 15.5563 14.7585 15.5556 14.4444C15.5548 14.1304 15.4481 13.8667 15.2356 13.6533C15.023 13.44 14.7593 13.3333 14.4444 13.3333H10C9.68518 13.3333 9.42148 13.44 9.20889 13.6533C8.9963 13.8667 8.88963 14.1304 8.88889 14.4444C8.88815 14.7585 8.99481 15.0226 9.20889 15.2367C9.42296 15.4507 9.68667 15.557 10 15.5556ZM10 11.1111H14.4444C14.7593 11.1111 15.0233 11.0044 15.2367 10.7911C15.45 10.5778 15.5563 10.3141 15.5556 10C15.5548 9.68593 15.4481 9.42222 15.2356 9.20889C15.023 8.99555 14.7593 8.88889 14.4444 8.88889H10C9.68518 8.88889 9.42148 8.99555 9.20889 9.20889C8.9963 9.42222 8.88963 9.68593 8.88889 10C8.88815 10.3141 8.99481 10.5781 9.20889 10.7922C9.42296 11.0063 9.68667 11.1126 10 11.1111ZM10 6.66667H14.4444C14.7593 6.66667 15.0233 6.56 15.2367 6.34667C15.45 6.13333 15.5563 5.86963 15.5556 5.55556C15.5548 5.24148 15.4481 4.97778 15.2356 4.76444C15.023 4.55111 14.7593 4.44444 14.4444 4.44444H10C9.68518 4.44444 9.42148 4.55111 9.20889 4.76444C8.9963 4.97778 8.88963 5.24148 8.88889 5.55556C8.88815 5.86963 8.99481 6.1337 9.20889 6.34778C9.42296 6.56185 9.68667 6.66815 10 6.66667ZM2.22222 20C1.61111 20 1.08815 19.7826 0.653333 19.3478C0.218519 18.913 0.000740741 18.3896 0 17.7778V2.22222C0 1.61111 0.217778 1.08815 0.653333 0.653333C1.08889 0.218519 1.61185 0.000740741 2.22222 0H17.7778C18.3889 0 18.9122 0.217778 19.3478 0.653333C19.7833 1.08889 20.0007 1.61185 20 2.22222V17.7778C20 18.3889 19.7826 18.9122 19.3478 19.3478C18.913 19.7833 18.3896 20.0007 17.7778 20H2.22222Z"],
    settings: ["0 0 20 19","M3.33644 2.048C4.36334 1.12852 5.56924 0.431257 6.87844 0C7.25306 0.468824 7.72837 0.847347 8.26915 1.10752C8.80993 1.3677 9.40232 1.50287 10.0024 1.503C10.6025 1.50299 11.1948 1.36798 11.7356 1.10798C12.2764 0.847973 12.7517 0.46964 13.1264 0.000999928C14.4356 0.432257 15.6415 1.12952 16.6684 2.049C16.4504 2.60755 16.3608 3.20797 16.4062 3.80583C16.4515 4.4037 16.6307 4.98372 16.9304 5.503C17.2304 6.02276 17.6435 6.46836 18.1391 6.80679C18.6347 7.14521 19.2001 7.36778 19.7934 7.458C20.0752 8.80677 20.0752 10.1992 19.7934 11.548C18.6334 11.726 17.5634 12.408 16.9304 13.503C16.6305 14.0224 16.4513 14.6026 16.4059 15.2007C16.3606 15.7987 16.4503 16.3993 16.6684 16.958C15.6414 17.8771 14.4356 18.574 13.1264 19.005C12.7517 18.5364 12.2764 18.158 11.7356 17.898C11.1948 17.638 10.6025 17.503 10.0024 17.503C9.40232 17.5031 8.80993 17.6383 8.26915 17.8985C7.72837 18.1587 7.25306 18.5372 6.87844 19.006C5.56924 18.5747 4.36334 17.8775 3.33644 16.958C3.55459 16.3993 3.64431 15.7987 3.59895 15.2007C3.5536 14.6026 3.37434 14.0224 3.07444 13.503C2.77433 12.9834 2.36118 12.538 1.86559 12.1998C1.36999 11.8615 0.804653 11.6391 0.211439 11.549C-0.0704796 10.1999 -0.0704796 8.8071 0.211439 7.458C0.804743 7.36778 1.37014 7.14521 1.86574 6.80679C2.36134 6.46836 2.77445 6.02276 3.07444 5.503C3.37419 4.98372 3.55336 4.4037 3.59871 3.80583C3.64407 3.20797 3.55443 2.60655 3.33644 2.048ZM11.5024 12.1C11.8464 11.9045 12.1482 11.6428 12.3906 11.3301C12.633 11.0174 12.8112 10.6599 12.9149 10.2781C13.0185 9.89626 13.0456 9.49771 12.9946 9.10537C12.9437 8.71303 12.8156 8.33465 12.6177 7.99202C12.4199 7.64938 12.1563 7.34927 11.842 7.10894C11.5277 6.86862 11.169 6.69283 10.7865 6.5917C10.404 6.49058 10.0053 6.46611 9.61326 6.51971C9.22127 6.5733 8.84375 6.70391 8.50244 6.904C7.81902 7.30465 7.32181 7.95936 7.11933 8.72525C6.91684 9.49113 7.02551 10.306 7.42161 10.9921C7.81772 11.6781 8.46912 12.1797 9.23365 12.3872C9.99817 12.5948 10.8138 12.4916 11.5024 12.1Z"]
  };
  const SB_COLLAPSED = "M7.29949 0H12.7005C13.8205 0 14.7087 -8.0237e-08 15.4236 0.0584615C16.1559 0.117949 16.7744 0.243077 17.3405 0.530256C18.2571 0.99779 19.0021 1.74351 19.4687 2.66051C19.7569 3.22462 19.8821 3.8441 19.9415 4.57641C20 5.29128 20 6.17949 20 7.29949V12.7005C20 13.8205 20 14.7087 19.9415 15.4236C19.8821 16.1559 19.7569 16.7744 19.4697 17.3405C19.0025 18.2569 18.2571 19.0019 17.3405 19.4687C16.7744 19.7569 16.1559 19.8821 15.4236 19.9415C14.7087 20 13.8205 20 12.7005 20H7.29949C6.17949 20 5.29128 20 4.57641 19.9415C3.8441 19.8821 3.22564 19.7569 2.66051 19.4697C1.74373 19.0027 0.998374 18.2573 0.531282 17.3405C0.243077 16.7744 0.117949 16.1559 0.0584615 15.4236C-8.0237e-08 14.7087 0 13.8205 0 12.7005V7.29949C0 6.17949 -8.0237e-08 5.29128 0.0584615 4.57641C0.117949 3.8441 0.243077 3.22564 0.530256 2.66051C0.997615 1.74358 1.74335 0.998199 2.66051 0.531282C3.22462 0.243077 3.8441 0.117949 4.57641 0.0584615C5.29128 -8.0237e-08 6.17949 0 7.29949 0ZM4.70154 1.59179C4.06564 1.64308 3.67077 1.74256 3.35795 1.90154C2.7309 2.22109 2.22109 2.7309 1.90154 3.35795C1.74256 3.67077 1.6441 4.06564 1.59179 4.70154C1.53949 5.34769 1.53846 6.17231 1.53846 7.33333V12.6667C1.53846 13.8287 1.53846 14.6533 1.59179 15.2985C1.64308 15.9344 1.74256 16.3292 1.90154 16.6421C2.22109 17.2691 2.7309 17.7789 3.35795 18.0985C3.67077 18.2574 4.06564 18.3559 4.70154 18.4082C5.10359 18.441 5.57436 18.4533 6.15385 18.4595V1.54051C5.57436 1.54564 5.10359 1.55897 4.70154 1.59179ZM14.6462 6.37949C14.5019 6.23544 14.3064 6.15452 14.1026 6.15452C13.8987 6.15452 13.7032 6.23544 13.559 6.37949L10.4821 9.45641C10.338 9.60064 10.2571 9.79615 10.2571 10C10.2571 10.2038 10.338 10.3994 10.4821 10.5436L13.559 13.6205C13.6294 13.6961 13.7143 13.7567 13.8087 13.7988C13.903 13.8408 14.0049 13.8634 14.1082 13.8652C14.2115 13.867 14.3141 13.848 14.4098 13.8094C14.5056 13.7707 14.5926 13.7131 14.6657 13.64C14.7387 13.567 14.7963 13.48 14.835 13.3842C14.8737 13.2884 14.8927 13.1858 14.8909 13.0825C14.889 12.9793 14.8664 12.8774 14.8244 12.783C14.7823 12.6887 14.7217 12.6038 14.6462 12.5333L12.1128 10L14.6462 7.46667C14.7902 7.32244 14.8711 7.12692 14.8711 6.92308C14.8711 6.71923 14.7902 6.52372 14.6462 6.37949Z";
  const SB_EXPANDED = "M7.29949 0H12.7005C13.8205 0 14.7087 -8.0237e-08 15.4236 0.0584615C16.1559 0.117949 16.7744 0.243077 17.3405 0.530256C18.2571 0.99779 19.0021 1.74351 19.4687 2.66051C19.7569 3.22462 19.8821 3.8441 19.9415 4.57641C20 5.29128 20 6.17949 20 7.29949V12.7005C20 13.8205 20 14.7087 19.9415 15.4236C19.8821 16.1559 19.7569 16.7744 19.4697 17.3405C19.0025 18.2569 18.2571 19.0019 17.3405 19.4687C16.7744 19.7569 16.1559 19.8821 15.4236 19.9415C14.7087 20 13.8205 20 12.7005 20H7.29949C6.17949 20 5.29128 20 4.57641 19.9415C3.8441 19.8821 3.22564 19.7569 2.66051 19.4697C1.74373 19.0027 0.998374 18.2573 0.531282 17.3405C0.243077 16.7744 0.117949 16.1559 0.0584615 15.4236C-8.0237e-08 14.7087 0 13.8205 0 12.7005V7.29949C0 6.17949 -8.0237e-08 5.29128 0.0584615 4.57641C0.117949 3.8441 0.243077 3.22564 0.530256 2.66051C0.997615 1.74358 1.74335 0.998199 2.66051 0.531282C3.22462 0.243077 3.8441 0.117949 4.57641 0.0584615C5.29128 -8.0237e-08 6.17949 0 7.29949 0ZM4.70154 1.59179C4.06564 1.64308 3.67077 1.74256 3.35795 1.90154C2.7309 2.22109 2.22109 2.7309 1.90154 3.35795C1.74256 3.67077 1.6441 4.06564 1.59179 4.70154C1.53949 5.34769 1.53846 6.17231 1.53846 7.33333V12.6667C1.53846 13.8287 1.53846 14.6533 1.59179 15.2985C1.64308 15.9344 1.74256 16.3292 1.90154 16.6421C2.22109 17.2691 2.7309 17.7789 3.35795 18.0985C3.67077 18.2574 4.06564 18.3559 4.70154 18.4082C5.10359 18.441 5.57436 18.4533 6.15385 18.4595V1.54051C5.57436 1.54564 5.10359 1.55897 4.70154 1.59179ZM11.5077 6.37949C11.3636 6.52372 11.2827 6.71923 11.2827 6.92308C11.2827 7.12692 11.3636 7.32244 11.5077 7.46667L14.041 10L11.5077 12.5333C11.4321 12.6038 11.3715 12.6887 11.3295 12.783C11.2874 12.8774 11.2648 12.9793 11.263 13.0825C11.2612 13.1858 11.2802 13.2884 11.3188 13.3842C11.3575 13.48 11.4151 13.567 11.4882 13.64C11.5612 13.7131 11.6482 13.7707 11.744 13.8094C11.8398 13.848 11.9424 13.867 12.0457 13.8652C12.1489 13.8634 12.2508 13.8408 12.3452 13.7988C12.4395 13.7567 12.5244 13.6961 12.5949 13.6205L15.6718 10.5436C15.8158 10.3994 15.8968 10.2038 15.8968 10C15.8968 9.79615 15.8158 9.60064 15.6718 9.45641L12.5949 6.37949C12.4506 6.23544 12.2551 6.15452 12.0513 6.15452C11.8474 6.15452 11.6519 6.23544 11.5077 6.37949Z";

  const PAGES = {
    home: 'Главная', profiles: 'Профили', proxies: 'Прокси', connections: 'Подключения',
    rules: 'Правила', logs: 'Логи', settings: 'Настройки'
  };

  const svg = (d, cls = 'size-4', vb = '0 0 24 24') =>
    `<svg class="${cls}" viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const LUCIDE = {
    dots: '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
    edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    gauge: '<path d="m12 14 4-4M3.3 19a10 10 0 1 1 17.4 0"/>',
    locate: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    pointer: '<path d="M4 4l7 17 2-7 7-2z"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
    play: '<path d="m6 3 14 9-14 9z"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>'
  };

  /* ---------- Состояние ---------- */
  const state = {
    page: 'home',
    dark: true,
    power: 'off',
    sidebar: false,
    connectedAt: 0,
    profile: 0,
    selected: { g0: 0, g1: 2, g2: 1, g3: 0 },
    open: { g0: true, g1: false, g2: false, g3: false },
    delays: {}
  };

  /* ---------- Боковая панель ---------- */
  const BTN_CLS = 'peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding,color,background-color,box-shadow] hover:bg-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:ring-1 active:ring-stroke active:bg-accent data-[active=true]:ring-1 data-[active=true]:ring-stroke data-[active=true]:bg-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 hover:ring-1 hover:ring-stroke hover:text-sidebar-accent-foreground h-8 text-sm cursor-pointer';
  $('nav').innerHTML = Object.entries(PAGES).map(([key, label]) => {
    const [vb, d] = NAV_ICONS[key];
    return `<li data-slot="sidebar-menu-item" data-sidebar="menu-item" class="group/menu-item relative"><button data-page-link="${key}" data-tip="${label}" data-tip-side="right" data-slot="sidebar-menu-button" data-sidebar="menu-button" data-size="default" data-active="${key === 'home'}" class="${BTN_CLS}"><svg viewBox="${vb}" fill="currentColor"><path d="${d}"/></svg><span>${label}</span></button></li>`;
  }).join('');

  function setSidebar(expanded) {
    state.sidebar = expanded;
    const sb = $('sb');
    sb.dataset.state = expanded ? 'expanded' : 'collapsed';
    sb.dataset.collapsible = expanded ? '' : 'icon';
    $('modeSw').classList.toggle('flex-col', !expanded);
    $('modeSw').classList.toggle('w-full', expanded);
    $('modeSw').querySelectorAll('.mode-btn').forEach((b) => b.classList.toggle('flex-1', expanded));
    $('sbToggleIcon').innerHTML = `<path d="${expanded ? SB_COLLAPSED : SB_EXPANDED}"/>`;
    $('sbToggle').dataset.tip = expanded ? 'Скрыть панель' : 'Показать панель';
    hideTip();
    emit('sidebar', expanded);
  }
  $('sbToggle').onclick = () => setSidebar(!state.sidebar);
  document.querySelectorAll('.mode-btn').forEach((btn) => btn.onclick = () => {
    document.querySelectorAll('.mode-btn').forEach((b) => {
      const on = b === btn;
      b.className = b.className
        .replace(/ ?bg-gradient-to-br from-gradient-start-power-on\/15 to-gradient-end-power-on\/15 border-stroke-power-on\/50 text-foreground shadow-sm| ?border-transparent text-muted-foreground hover:text-foreground/g, '')
        + (on ? ' bg-gradient-to-br from-gradient-start-power-on/15 to-gradient-end-power-on/15 border-stroke-power-on/50 text-foreground shadow-sm' : ' border-transparent text-muted-foreground hover:text-foreground');
    });
    toast(btn.dataset.mode === 'rule' ? 'Режим: по правилам' : 'Режим: глобальный', 'info');
  });

  /* ---------- Страницы ---------- */
  function go(page) {
    if (!PAGES[page]) return;
    state.page = page;
    document.querySelectorAll('.page').forEach((p) => p.classList.toggle('on', p.dataset.page === page));
    document.querySelectorAll('[data-page-link]').forEach((b) => b.dataset.active = String(b.dataset.pageLink === page));
    $('pageTitle').textContent = PAGES[page];
    $('hdrNew').style.display = page === 'profiles' ? '' : 'none';
    // На всех страницах, кроме главной, карта на фоне размыта (App.tsx)
    $('map').classList.toggle('blur-3xl', page !== 'home');
    $('content').scrollTop = 0;
    // Список прокси прокручивается сам; в клиенте страница монтируется заново и начинает с начала
    document.querySelectorAll('[data-virtuoso-scroller]').forEach((s) => { s.scrollTop = 0; });
    // Класс анимации раскрытия - только у группы, раскрытой сейчас; на заново открытой странице его нет
    document.querySelectorAll('#proxyGroups .animate-proxy-row-enter').forEach((el) => el.classList.remove('animate-proxy-row-enter'));
    closePortals();
    replay();
    emit('page', page);
  }
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-page-link]');
    if (link) go(link.dataset.pageLink);
  });

  /* Перезапуск анимаций появления: в клиенте страница монтируется заново при переходе */
  function replay() {
    const cur = document.querySelector('.page.on');
    if (!cur) return;
    cur.style.display = 'none';
    void cur.offsetHeight;
    cur.style.display = '';
  }

  /* ---------- Тема клиента: тёмная / светлая ---------- */
  function setDark(dark) {
    state.dark = dark;
    html.classList.toggle('dark', dark);
    html.style.colorScheme = dark ? 'dark' : 'light';
    // App.tsx задаёт цвет обёртки инлайн-стилем и меняет картинку карты
    $('wrapper').style.backgroundColor = dark ? '#080F16' : '#C5D4F1';
    $('map').src = dark ? 'map-dark.svg' : 'map-light.svg';
    document.querySelectorAll('[data-theme-tab]').forEach((t) => {
      t.dataset.state = (t.dataset.themeTab === (dark ? 'dark' : 'light')) ? 'active' : 'inactive';
    });
    document.querySelectorAll('[data-sonner-toaster]').forEach((t) => t.dataset.theme = dark ? 'dark' : 'light');
    emit('dark', dark);
  }

  /* ---------- Кнопка подключения ---------- */
  let loadTimer = 0;
  function setPower(s) {
    clearTimeout(loadTimer);
    state.power = s;
    const c = $('powerCircle'), on = s === 'on';
    c.className = c.className.replace(/from-gradient-start-power-\w+\/\d+ to-gradient-end-power-\w+\/\d+ border-stroke-power-\w+/,
      on ? 'from-gradient-start-power-on/60 to-gradient-end-power-on/60 border-stroke-power-on' : 'from-gradient-start-power-off/50 to-gradient-end-power-off/50 border-stroke-power-off');
    const kids = c.querySelector('.relative').children;
    const vis = [s === 'loading', s === 'on', s === 'off', s === 'error'];
    [...kids].forEach((k, i) => {
      k.classList.toggle('opacity-100', vis[i]); k.classList.toggle('scale-100', vis[i]);
      k.classList.toggle('opacity-0', !vis[i]); k.classList.toggle('scale-90', !vis[i]);
    });
    $('statusText').textContent = { off: 'Отключено', on: 'Подключено', loading: 'Подключение...', error: 'Проблема с ядром' }[s];
    for (const id of ['timer', 'traffic']) {
      const el = $(id);
      el.classList.toggle('opacity-100', on); el.classList.toggle('opacity-0', !on);
      el.classList.toggle('translate-y-0', on);
    }
    if (on && !state.connectedAt) state.connectedAt = Date.now() - 5000;
    if (!on) state.connectedAt = 0;
    tick();
    emit('power', s);
  }
  $('power').onclick = () => {
    if (state.power === 'on' || state.power === 'loading') { setPower('off'); return; }
    setPower('loading');
    loadTimer = setTimeout(() => setPower('on'), 1400);
  };
  const fmtSpeed = (b) => b > 1048576 ? (b / 1048576).toFixed(1) + ' MB/s' : b > 1024 ? (b / 1024).toFixed(0) + ' KB/s' : b + ' B/s';
  function tick() {
    if (state.power !== 'on') { $('timer').textContent = '00:00:00'; return; }
    const t = Math.floor((Date.now() - state.connectedAt) / 1000);
    const p = (n) => String(n).padStart(2, '0');
    $('timer').textContent = `${p(Math.floor(t / 3600))}:${p(Math.floor(t / 60) % 60)}:${p(t % 60)}`;
    $('up').textContent = fmtSpeed(Math.round(20000 + Math.random() * 180000));
    $('down').textContent = fmtSpeed(Math.round(300000 + Math.random() * 4200000));
  }
  setInterval(tick, 1000);
  $('groupSelector').onclick = () => go('proxies');

  /* ---------- Профили ---------- */
  /* updated/every - подвал удалённого профиля: «Обновлено: ...» и интервал автообновления */
  const PROFILES = [
    { name: 'Koala VPN · Premium', traffic: '184.2 GB', days: '23', updated: '5 минут назад', every: '12 ч' },
    { name: 'Рабочий', traffic: '∞', days: '∞' },
    { name: 'Резервный · Lite', traffic: '12.7 GB', days: '4', updated: 'день назад', every: '1 д' },
    { name: 'Семейный', traffic: '512 GB', days: '61', updated: '2 часа назад', every: '6 ч' }
  ];
  const clock = svg('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>', 'size-3');
  function renderProfiles() {
    $('profileGrid').innerHTML = PROFILES.map((p, i) => {
      const act = i === state.profile;
      const remote = !!p.updated;
      const foot = remote ? `<span>Обновлено: ${p.updated}</span><span class="flex items-center gap-1">${clock}${p.every}</span>` : '<span>Локальный профиль</span>';
      return `<div class="relative col-span-1"><div role="button" tabindex="0" aria-selected="${act}" aria-busy="false" data-profile="${i}" class="group relative rounded-2xl backdrop-blur-3xl border px-4 pt-3 pb-2 cursor-pointer transition-all duration-200 ${act ? 'border-stroke-profile-active bg-profile-active hover:bg-profile-active/90' : 'border-stroke-profile-inactive bg-profile-inactive hover:bg-accent/60'}"><div class="w-full h-full">
        <div class="flex items-center gap-2"><h3 class="text-sm font-semibold truncate flex-1 leading-tight">${esc(p.name)}</h3><div class="shrink-0 -mr-1 flex items-center">${remote ? `<button data-act="refresh-profile" data-slot="button" data-variant="ghost" data-size="icon-sm" class="inline-flex items-center justify-center rounded-lg transition-all hover:bg-accent/50 text-foreground size-8 p-1 bg-clip-content cursor-pointer">${svg(LUCIDE.refresh, 'text-base text-muted-foreground size-4')}</button>` : ''}<button data-menu="profile" data-slot="button" data-variant="ghost" data-size="icon-sm" class="inline-flex items-center justify-center rounded-lg transition-all hover:bg-accent/50 text-foreground size-8 p-1 bg-clip-content cursor-pointer">${svg(LUCIDE.dots, 'text-base text-muted-foreground size-4')}</button></div></div>
        <div class="grid grid-cols-2 mt-2"><div class="pr-3 border-r border-foreground/10 justify-items-center"><div class="text-[11px] text-muted-foreground">Трафика осталось:</div><div class="text-sm font-bold mt-0.5 leading-tight">${p.traffic}</div></div><div class="pl-3 justify-items-center"><div class="text-[11px] text-muted-foreground">Дней осталось:</div><div class="text-sm font-bold mt-0.5 leading-tight">${p.days}</div></div></div>
        <div class="border-t border-foreground/10 mt-3 pt-2 flex items-center justify-between text-[11px] text-muted-foreground">${foot}</div>
      </div></div></div>`;
    }).join('');
  }
  /* Переключение - как в profile-item.tsx: пока ядро перезапускается (и ещё 500 мс), у всех карточек
     aria-busy и курсор ожидания, а та, на которую щёлкнули, тускнеет и чуть сжимается */
  let switching = false;
  $('profileGrid').addEventListener('click', (e) => {
    if (e.target.closest('[data-menu], [data-act]') || switching) return;
    const card = e.target.closest('[data-profile]');
    if (!card) return;
    const i = +card.dataset.profile;
    if (i === state.profile) return;
    const cards = [...document.querySelectorAll('[data-profile]')];
    const busy = (on) => cards.forEach((c) => { c.setAttribute('aria-busy', String(on)); c.classList.toggle('cursor-wait', on); });
    switching = true;
    busy(true);
    card.classList.add('opacity-60', 'scale-[0.98]');
    setTimeout(() => {
      const prevCard = document.querySelector(`[data-profile="${state.profile}"]`);
      state.profile = i;
      const ACT = 'border-stroke-profile-active bg-profile-active hover:bg-profile-active/90'.split(' ');
      const INACT = 'border-stroke-profile-inactive bg-profile-inactive hover:bg-accent/60'.split(' ');
      if (prevCard) { prevCard.classList.remove(...ACT); prevCard.classList.add(...INACT); prevCard.setAttribute('aria-selected', 'false'); }
      card.classList.remove(...INACT); card.classList.add(...ACT); card.setAttribute('aria-selected', 'true');
      $('homeProfile').textContent = PROFILES[i].name;
      $('trafficLeft').textContent = PROFILES[i].traffic;
      setTimeout(() => {
        card.classList.remove('opacity-60', 'scale-[0.98]');
        busy(false);
        switching = false;
        toast(`Профиль «${PROFILES[i].name}» активирован`, 'success');
      }, 500);
    }, 400);
  });

  /* ---------- Прокси (components/proxies/proxy-item.tsx) ---------- */
  const GROUPS = [
    { id: 'g0', name: '🚀 Выбор сервера', type: 'Selector', icon: 'pointer', proxies: [
      ['🇳🇱 Нидерланды · Амстердам', 'VLESS Reality', 48], ['🇩🇪 Германия · Франкфурт', 'VLESS Reality', 62],
      ['🇫🇮 Финляндия · Хельсинки', 'Hysteria2 · 🇫🇮→🇩🇪', 71], ['🇯🇵 Япония · Токио', 'Trojan · релей 🇰🇷', 614],
      ['🇺🇸 США · Нью-Йорк', 'VMess', 138], ['🇬🇧 Великобритания · Лондон', 'Shadowsocks', 0],
      ['🇹🇷 Турция · Стамбул', 'VLESS', 95], ['🇰🇿 Казахстан · Алматы', 'VLESS Reality · 🇪🇺 выход', 39],
      ['🇸🇪 Швеция · Стокгольм', 'WireGuard', 83]
    ] },
    { id: 'g1', name: '⚡ Автовыбор', type: 'URLTest', icon: 'zap', proxies: [
      ['🇳🇱 Нидерланды · Амстердам', 'VLESS Reality', 48], ['🇩🇪 Германия · Франкфурт', 'VLESS Reality', 62],
      ['🇫🇮 Финляндия · Хельсинки', 'Hysteria2', 71], ['🇰🇿 Казахстан · Алматы', 'VLESS Reality', 39]
    ] },
    { id: 'g2', name: '🎬 YouTube', type: 'Selector', img: 'youtube', proxies: [
      ['🚀 Выбор сервера', 'Selector', -1], ['🇩🇪 Германия · Франкфурт', 'VLESS Reality', 62], ['DIRECT', 'Direct', -1]
    ] },
    { id: 'g3', name: '🌍 Остальной трафик', type: 'Selector', img: 'world', proxies: [
      ['DIRECT', 'Direct', -1], ['🚀 Выбор сервера', 'Selector', -1], ['REJECT', 'Reject', -1]
    ] }
  ];
  /* Цвет значка и бейджа по типу группы - как groupTypeColor в pages/proxies.tsx */
  const TYPE_COLOR = {
    Selector: 'border-blue-500/40 bg-blue-500/8 text-blue-600 dark:text-blue-400 dark:border-blue-400/40',
    URLTest: 'border-emerald-500/40 bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400/40'
  };
  /* Картинки групп, как их присылают провайдеры (поле icon группы): логотипы без своего фона */
  const GROUP_IMG = {
    youtube: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect x="3" y="10" width="42" height="28" rx="9" fill="#ff0033"/><path d="M20 17v14l12-7z" fill="#fff"/></svg>',
    world: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="24" r="19" fill="#2f8cff"/><path d="M13 13c4-2 10 0 10 4s-5 4-4 8 6 5 2 9c-3 2-7-2-8-7s-4-10 0-14z" fill="#4cd471"/><path d="M30 9c5 1 8 5 10 10-3 1-6-1-8 1s0 6-3 6-4-6-2-9-2-6 3-8z" fill="#4cd471"/></svg>'
  };
  /* Avatar у клиента без фона (bg-transparent), квадрат по типу - когда картинки нет */
  const groupIcon = (g) => g.img
    ? `<span data-slot="avatar" data-size="default" class="group/avatar relative flex shrink-0 overflow-hidden select-none bg-transparent rounded-md size-9"><img data-slot="avatar-image" class="aspect-square size-full" alt="" src="data:image/svg+xml;utf8,${encodeURIComponent(GROUP_IMG[g.img])}"></span>`
    : `<div class="flex items-center justify-center shrink-0 size-9 rounded-md ${TYPE_COLOR[g.type]}">${svg(LUCIDE[g.icon])}</div>`;
  /* Как delayColorClass/delayContent в proxy-item.tsx: -1 - не проверялся, 0 - таймаут, порог 500 мс */
  const delayCls = (d) => d < 0 ? 'text-primary' : d === 0 ? 'text-destructive' : d < 500 ? 'text-success' : 'text-warning';
  const delayText = (d) => d < 0 ? svg(LUCIDE.gauge, 'size-3.5') : d === 0 ? '–' : d;

  const TONES = {
    sel:'bg-primary/10 hover:bg-primary/15 border-primary/30 shadow-sm shadow-primary/10',
    off: 'hover:bg-accent/50'
  };
  /* Как React: меняем только классы, элемент остаётся тем же - иначе обрываются переходы и эффекты нажатия */
  function setTone(el, tone) {
    Object.values(TONES).forEach((t) => t.split(' ').forEach((c) => el.classList.remove(c)));
    TONES[tone].split(' ').forEach((c) => el.classList.add(c));
  }
  function proxyCard(g, p, i) {
    const [name, type, d0] = p;
    const d = state.delays[g.id + i] ?? d0;
    const tone = TONES[state.selected[g.id] === i ? 'sel' : 'off'];
    return `<div data-slot="card" data-proxy="${g.id}:${i}" class="text-card-foreground flex flex-col gap-6 rounded-xl border shadow-sm w-full gap-0 py-0 rounded-lg cursor-pointer transition-all duration-150 relative overflow-hidden ${tone}"><div data-slot="card-content" class="pl-4 pr-4 py-2"><div class="flex gap-1"><div class="flex flex-col gap-0 flex-1 min-w-0"><div class="flex items-center gap-1.5"><span class="flag-emoji text-sm truncate" title="${esc(name)}">${esc(name)}</span></div><div class="text-[11px] text-muted-foreground leading-none mt-0.5"><span>${type}</span></div></div><div class="flex items-center justify-center gap-0.5 shrink-0"><button data-delay="${g.id}:${i}" data-slot="button" data-variant="ghost" data-size="default" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm transition-all hover:bg-accent/50 text-foreground h-7 w-8 min-w-8 px-0 text-xs font-medium cursor-pointer"><span class="relative inline-flex items-center justify-center w-full"><span class="${delayCls(d)}">${delayText(d)}</span></span></button></div></div></div></div>`;
  }

  // Кнопки в шапке раскрытой группы
  const groupActions = (g) => `<div class="flex items-center" data-group-actions><button data-act="locate" data-tip="К выбранному" data-slot="button" data-variant="ghost" data-size="icon-sm" class="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all hover:bg-accent/50 text-foreground size-8 p-1 bg-clip-content">${svg(LUCIDE.locate)}</button><button data-test="${g.id}" data-tip="Проверить задержку" data-slot="button" data-variant="ghost" data-size="icon-sm" class="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all hover:bg-accent/50 text-foreground size-8 p-1 bg-clip-content">${svg(LUCIDE.gauge)}</button></div>`;
  // Каждая шапка группы и блок её серверов - в своей обёртке, как элементы GroupedVirtuoso
  function groupHead(g, gi) {
    const open = state.open[g.id];
    const cur = g.proxies[state.selected[g.id]]?.[0] ?? '';
    return `<div data-index="0" data-item-index="${gi}" style="overflow-anchor: none;"><div class="w-full px-2 pb-2"><div data-slot="card" data-group="${g.id}" ${gi === 0 ? 'data-guide="proxies-first-group"' : ''} data-guide-open="${open}" class="text-card-foreground flex flex-col gap-6 rounded-xl border shadow-sm w-full relative isolate bg-card/50 backdrop-blur-3xl cursor-pointer py-0 transition-all duration-200 hover:bg-card/65 ${open ? 'z-10 shadow-md' : 'hover:shadow-sm'}">
        <div data-slot="card-content" class="w-full px-4 py-3"><div class="flex justify-between items-center"><div class="flex items-center gap-3 min-w-0 flex-1">
          ${groupIcon(g)}
          <div class="flex flex-col gap-0.5 min-w-0"><div class="flex items-center gap-2"><span class="flag-emoji text-sm font-semibold truncate leading-tight">${esc(g.name)}</span><span data-slot="badge" data-variant="ghost" class="inline-flex items-center justify-center border w-fit whitespace-nowrap shrink-0 gap-1 overflow-hidden text-[10px] px-1.5 py-0 h-4 rounded font-semibold uppercase tracking-wider ${TYPE_COLOR[g.type]}">${g.type}</span></div>
          <span class="flag-emoji text-xs text-muted-foreground truncate leading-tight">${esc(cur)}</span></div></div>
          <div class="flex items-center gap-0.5 shrink-0">${open ? groupActions(g) : ''}
          ${svg(LUCIDE.chevron, `transition-transform duration-200 ml-1 size-5 ${open ? 'rotate-180' : ''}`)}</div>
        </div></div></div></div></div>`;
  }
  // Серверы группы. Как в клиенте, каждая строка - отдельный элемент списка со своей подложкой, число
  // колонок - по ширине окна (calcCols). Анимация раскрытия - только у группы, которую раскрыли сейчас
  // (recentlyOpenedRef), каждая следующая строка - на 40 мс позже
  const calcCols = () => (matchMedia('(min-width: 1536px)').matches ? 5 : matchMedia('(min-width: 1280px)').matches ? 4 : matchMedia('(min-width: 1024px)').matches ? 3 : 2);
  const groupRows = (g, gi, animate) => {
    const cols = calcCols();
    const rows = Math.ceil(g.proxies.length / cols);
    return Array.from({ length: rows }, (_, r) => {
      const last = r === rows - 1;
      const cls = ['mx-2 bg-card/30 border-x border-border/50', r === 0 && '-mt-5 pt-3', last && 'rounded-b-xl border-b shadow-sm mb-2', animate && 'animate-proxy-row-enter'].filter(Boolean).join(' ');
      const delay = animate ? ` style="animation-delay: ${Math.min(r * 0.04, 0.3)}s;"` : '';
      const cards = g.proxies.slice(r * cols, r * cols + cols).map((p, i) => proxyCard(g, p, r * cols + i)).join('');
      return `<div data-index="0" data-item-group-index="${gi}" style="overflow-anchor: none;"><div class="flow-root"><div class="${cls}"${delay}><div ${gi === 0 ? 'data-guide="proxies-first-group-row"' : ''} class="grid gap-2 px-3 pt-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5${last ? ' pb-3' : ''}">${cards}</div></div></div></div>`;
    }).join('');
  };
  const reindex = () => [...$('proxyGroups').children].forEach((el, i) => { el.dataset.index = String(i); });

  function renderProxies() {
    $('proxyGroups').innerHTML = GROUPS.map((g, gi) => groupHead(g, gi) + (state.open[g.id] ? groupRows(g, gi, false) : '')).join('');
    reindex();
  }
  // При смене ширины окна меняется число колонок - клиент пересобирает строки, макет тоже
  let lastCols = calcCols();
  addEventListener('resize', () => { const c = calcCols(); if (c !== lastCols) { lastCols = c; renderProxies(); } });
  // Раскрытие и сворачивание меняют только эту группу: шапка остаётся на месте (стрелка поворачивается
  // плавно), блок серверов добавляется или убирается. Остальные группы не перерисовываются
  function toggleGroup(gid) {
    const gi = GROUPS.findIndex((x) => x.id === gid);
    const g = GROUPS[gi];
    const open = state.open[gid] = !state.open[gid];
    const card = $('proxyGroups').querySelector(`[data-group="${gid}"]`);
    const wrap = card.closest('[data-item-index]');
    card.dataset.guideOpen = String(open);
    card.classList.toggle('z-10', open);
    card.classList.toggle('shadow-md', open);
    card.classList.toggle('hover:shadow-sm', !open);
    const chevron = card.querySelector('svg.ml-1');
    chevron.classList.toggle('rotate-180', open);
    if (open) {
      chevron.insertAdjacentHTML('beforebegin', groupActions(g));
      wrap.insertAdjacentHTML('afterend', groupRows(g, gi, true));
    } else {
      card.querySelector('[data-group-actions]')?.remove();
      while (wrap.nextElementSibling?.dataset.itemGroupIndex === String(gi)) wrap.nextElementSibling.remove();
    }
    reindex();
  }
  $('proxyGroups').addEventListener('click', (e) => {
    const test = e.target.closest('[data-test]');
    if (test) { e.stopPropagation(); testGroup(test.dataset.test); return; }
    if (e.target.closest('[data-act="locate"]')) { e.stopPropagation(); return; }
    const delay = e.target.closest('[data-delay]');
    if (delay) { e.stopPropagation(); testOne(delay.dataset.delay); return; }
    const head = e.target.closest('[data-group]');
    if (head) { toggleGroup(head.dataset.group); return; }
    const card = e.target.closest('[data-proxy]');
    if (card) {
      const [gid, i] = card.dataset.proxy.split(':');
      const g = GROUPS.find((x) => x.id === gid);
      const prev = state.selected[gid];
      state.selected[gid] = +i;
      const prevEl = document.querySelector(`[data-proxy="${gid}:${prev}"]`);
      if (prevEl && prev !== +i) setTone(prevEl, 'off');
      setTone(card, 'sel');
      const sub = document.querySelector(`[data-group="${gid}"] span.text-xs`);
      if (sub) sub.textContent = g.proxies[+i][0];
      if (gid === 'g0') $('homeProxy').textContent = GROUPS[0].proxies[+i][0];
    }
  });
  function spinIn(btn) {
    const span = btn.querySelector('span > span');
    if (span) span.outerHTML = `<span class="kt-spin inline-flex">${svg(LUCIDE.refresh, 'size-3')}</span>`;
  }
  function testOne(key) {
    const btn = document.querySelector(`[data-delay="${key}"]`);
    if (btn) spinIn(btn);
    setTimeout(() => {
      const r = Math.random();
      const d = r < 0.08 ? 0 : r < 0.22 ? Math.round(500 + Math.random() * 400) : Math.round(30 + Math.random() * 240);
      state.delays[key.replace(':', '')] = d;
      const b = document.querySelector(`[data-delay="${key}"]`);
      if (b) b.firstElementChild.innerHTML = `<span class="${delayCls(d)}">${delayText(d)}</span>`;
    }, 500 + Math.random() * 600);
  }
  function testGroup(gid) {
    const g = GROUPS.find((x) => x.id === gid);
    g.proxies.forEach((p, i) => { if (p[2] >= 0) testOne(`${gid}:${i}`); });
  }

  /* ---------- Подключения ---------- */
  const CONNS = [
    ['chrome.exe', 'www.youtube.com:443', '🇩🇪 Германия · Франкфурт', '12.4 MB', '380 KB', true],
    ['Telegram.exe', '149.154.167.51:443', '🇳🇱 Нидерланды · Амстердам', '2.1 MB', '96 KB', true],
    ['Discord.exe', 'gateway.discord.gg:443', '🇫🇮 Финляндия · Хельсинки', '840 KB', '120 KB', true],
    ['steam.exe', 'store.steampowered.com:443', 'DIRECT', '31.7 MB', '1.2 MB', false],
    ['Code.exe', 'api.github.com:443', '🇳🇱 Нидерланды · Амстердам', '410 KB', '52 KB', true],
    ['svchost.exe', 'time.windows.com:123', 'DIRECT', '2 KB', '2 KB', false]
  ];
  let connTab = 'active';
  function renderConns() {
    $('connTabs').innerHTML = [['active', 'Активные'], ['closed', 'Закрытые']].map(([k, l]) => tabBtn(k, l, connTab === k, 'conn-tab')).join('');
    const list = connTab === 'active' ? CONNS : CONNS.slice(3, 5);
    $('connList').innerHTML = list.map(([app, host, via, down, up, proxied], i) => `<div class="px-2 pb-2" style="height:72px"><div class="w-full h-full flex items-center cursor-pointer rounded-xl border transition-all duration-200 ease-out ${i === 0 && connTab === 'active' ? 'border-stroke-power-on/30 bg-linear-to-r from-gradient-start-power-on/[0.06] to-card/40 hover:border-stroke-power-on/50 shadow-sm' : 'border-border bg-card/40 hover:bg-accent/50'}"><div class="pl-3"><div class="size-12 rounded-lg bg-muted flex items-center justify-center shrink-0"><span class="text-xs font-semibold text-muted-foreground">${app.slice(0, 2).toUpperCase()}</span></div></div><div class="px-3 flex flex-col gap-1 min-w-0 grow"><span class="text-sm font-medium truncate">${app} → ${host}</span><span class="flag-emoji text-xs text-muted-foreground truncate">${esc(via)} · ${down} ↓ ${up} ↑</span></div><div class="pr-3 shrink-0"><span data-slot="badge" data-variant="outline" class="inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 overflow-hidden border-border text-foreground">${proxied ? 'PROXY' : 'DIRECT'}</span></div></div></div>`).join('');
  }
  function tabBtn(key, label, active, kind) {
    return `<button role="tab" data-${kind}="${key}" data-slot="tabs-trigger" data-state="${active ? 'active' : 'inactive'}" class="relative inline-flex h-[calc(100%-1px)] items-center justify-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all duration-200 text-muted-foreground hover:text-foreground border border-transparent cursor-pointer group-data-[variant=default]/tabs-list:data-[state=active]:bg-gradient-to-br group-data-[variant=default]/tabs-list:data-[state=active]:from-gradient-start-power-on/15 group-data-[variant=default]/tabs-list:data-[state=active]:to-gradient-end-power-on/15 group-data-[variant=default]/tabs-list:data-[state=active]:border-stroke-power-on/50 group-data-[variant=default]/tabs-list:data-[state=active]:text-foreground group-data-[variant=default]/tabs-list:data-[state=active]:shadow-sm">${label}</button>`;
  }
  $('connTabs').addEventListener('click', (e) => {
    const t = e.target.closest('[data-conn-tab]');
    if (t) { connTab = t.dataset.connTab; renderConns(); }
  });

  /* ---------- Правила ---------- */
  const RULES = [
    ['DOMAIN-SUFFIX', 'youtube.com', '🎬 YouTube'], ['DOMAIN-SUFFIX', 'googlevideo.com', '🎬 YouTube'],
    ['DOMAIN-KEYWORD', 'telegram', '🚀 Выбор сервера'], ['GEOSITE', 'discord', '🚀 Выбор сервера'],
    ['GEOIP', 'RU', 'DIRECT'], ['DOMAIN-SUFFIX', 'gosuslugi.ru', 'DIRECT'], ['IP-CIDR', '192.168.0.0/16', 'DIRECT'],
    ['PROCESS-NAME', 'steam.exe', 'DIRECT'], ['GEOSITE', 'category-ads-all', 'REJECT'], ['MATCH', '', '🌍 Остальной трафик']
  ];
  $('ruleList').innerHTML = RULES.map(([type, payload, proxy], i) => `<div class="px-2 pb-2 ${i === 0 ? 'pt-0' : ''}"><div data-slot="card" class="text-card-foreground flex flex-col rounded-xl border shadow-sm gap-0 py-0"><div data-slot="card-content" class="w-full px-3 py-2">${payload ? `<div title="${payload}" class="text-sm text-ellipsis whitespace-nowrap overflow-hidden mb-1">${payload}</div>` : ''}<div class="flex gap-1.5"><span data-slot="badge" data-variant="outline" class="inline-flex items-center justify-center rounded-full border border-transparent px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 overflow-hidden border-border text-foreground rounded-sm">${type}</span><span data-slot="badge" data-variant="outline" class="inline-flex items-center justify-center rounded-full border border-transparent px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 overflow-hidden border-border text-foreground rounded-sm flag-emoji">${esc(proxy)}</span></div></div></div></div>`).join('');

  /* ---------- Логи ---------- */
  const LOG_BADGE = { error: 'bg-destructive/15 text-destructive', warning: 'bg-warning/20 text-amber-700 dark:text-warning', info: 'bg-primary/10 text-primary', debug: 'bg-muted text-muted-foreground' };
  const LOGS = [
    ['info', '[TCP] 127.0.0.1:52144 --> www.youtube.com:443 match DomainSuffix(youtube.com) using 🎬 YouTube[🇩🇪 Германия · Франкфурт]'],
    ['info', '[TCP] 127.0.0.1:52151 --> api.telegram.org:443 match DomainKeyword(telegram) using 🚀 Выбор сервера[🇳🇱 Нидерланды · Амстердам]'],
    ['debug', '[DNS] resolve gateway.discord.gg A --> 162.159.135.232'],
    ['warning', '[Provider] proxy-providers: koala update failed, retry in 30s'],
    ['info', '[TCP] 127.0.0.1:52160 --> store.steampowered.com:443 match ProcessName(steam.exe) using DIRECT'],
    ['error', 'dial tcp 203.0.113.7:443: i/o timeout (🇬🇧 Великобритания · Лондон)'],
    ['info', '[UDP] 127.0.0.1:61022 --> 8.8.8.8:53 match GeoIP(US) using 🚀 Выбор сервера[🇳🇱 Нидерланды · Амстердам]'],
    ['debug', '[Sniffer] sniff TLS [www.google.com:443] → www.google.com'],
    ['info', '[TCP] 127.0.0.1:52177 --> gosuslugi.ru:443 match DomainSuffix(gosuslugi.ru) using DIRECT']
  ];
  $('logList').innerHTML = LOGS.map(([type, payload], i) => `<div class="select-text grid grid-cols-[var(--log-seq-width,3ch)_auto_3.75rem_1fr] items-baseline gap-x-1 mx-2 px-3 py-1.5 border-b ${type === 'error' ? 'bg-destructive/5' : ''}"><span class="justify-self-end mr-1 text-xs tabular-nums text-muted-foreground">${i + 1}</span><time class="text-xs tabular-nums text-muted-foreground">14:0${Math.floor(i / 3)}:${String(12 + i * 5).padStart(2, '0')}</time><span class="justify-self-start rounded px-1.5 text-[10px] leading-4 font-semibold uppercase tracking-wide ${LOG_BADGE[type]}">${type === 'warning' ? 'warn' : type}</span><span class="flag-emoji min-w-0 break-words text-[13px] leading-5">${esc(payload)}</span></div>`).join('');

  /* ---------- Настройки ---------- */
  const SEP = '<div data-slot="separator" data-orientation="horizontal" class="bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full my-2"></div>';
  const row = (title, control, last) => `<div><div class="h-[32px] w-full flex items-center justify-between gap-4"><div class="h-full flex items-center"><h4 class="h-full text-md leading-[32px] whitespace-nowrap">${title}</h4></div>${control}</div>${last ? '' : SEP}</div>`;
  const sw = (on, key) => `<button role="switch" data-switch="${key}" data-state="${on ? 'checked' : 'unchecked'}" data-slot="switch" data-size="default" class="peer group/switch inline-flex shrink-0 items-center rounded-full border transition-all outline-none data-[state=unchecked]:border-stroke data-[state=unchecked]:bg-card/50 data-[state=unchecked]:backdrop-blur-xl data-[state=checked]:border-stroke-power-on data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-gradient-start-power-on data-[state=checked]:to-gradient-end-power-on data-[size=default]:h-5 data-[size=default]:w-9 cursor-pointer"><span data-state="${on ? 'checked' : 'unchecked'}" data-slot="switch-thumb" class="pointer-events-none block rounded-full ring-0 transition-transform data-[state=unchecked]:bg-muted-foreground/60 data-[state=checked]:bg-white group-data-[size=default]/switch:size-3.5 data-[state=checked]:translate-x-[calc(100%+4px)] data-[state=unchecked]:translate-x-0.5"></span></button>`;
  const themeTabs = `<div data-slot="tabs" data-orientation="horizontal" class="group/tabs flex gap-2 data-[orientation=horizontal]:flex-col"><div role="tablist" data-slot="tabs-list" data-variant="default" class="rounded-lg p-[3px] group-data-[orientation=horizontal]/tabs:h-8 group/tabs-list text-muted-foreground inline-flex w-fit items-center justify-center border border-stroke bg-card/50 backdrop-blur-xl">${[['system', 'Системная'], ['dark', 'Тёмная'], ['light', 'Светлая']].map(([k, l]) => tabBtn(k, l, k === 'dark', 'theme-tab')).join('')}</div></div>`;
  const select = (val, key) => `<button type="button" role="combobox" data-select="${key}" data-slot="select-trigger" data-size="sm" data-state="closed" class="border-stroke [&_svg:not([class*='text-'])]:text-muted-foreground flex w-fit items-center justify-between gap-2 rounded-xl border bg-card/50 backdrop-blur-xl px-3 py-2 text-sm whitespace-nowrap transition-[color,box-shadow] outline-none data-[size=sm]:h-8 cursor-pointer"><span data-slot="select-value">${val}</span>${svg(LUCIDE.chevron, 'size-4 opacity-50')}</button>`;
  const BTN = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-stroke bg-card/50 backdrop-blur-xl hover:bg-accent/50 text-foreground',
    destructive: 'bg-destructive text-white hover:bg-destructive/90',
    secondary: 'bg-accent/50 text-foreground hover:bg-accent/80'
  };
  const button = (variant, label, act, size = 'sm') => `<button data-act="${act}" data-slot="button" data-variant="${variant}" data-size="${size}" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all outline-none ${BTN[variant]} ${size === 'sm' ? 'h-8 px-3' : 'h-9 px-4 py-2'} cursor-pointer">${label}</button>`;
  $('settingsBody').innerHTML = `
    <div data-slot="card" class="text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm mx-2 mb-2"><div data-slot="card-content" class="px-6">
      ${row('Тема', themeTabs)}
      ${row('Запускать при входе в систему', sw(true, 'autostart'))}
      ${row('Тихий запуск', sw(false, 'silent'))}
      ${row('Плавающее окно скорости', sw(true, 'floating'))}
      ${row('Язык', select('Русский', 'lang'))}
      ${row('Тестовый URL', '<input data-slot="input" value="https://www.gstatic.com/generate_204" class="file:text-foreground placeholder:text-muted-foreground border-stroke h-9 w-full min-w-0 rounded-xl border bg-card/50 backdrop-blur-xl px-3 py-1 text-base transition-[color,box-shadow] outline-none md:text-sm focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke max-w-64">', true)}
      <div class="flex gap-2 mt-4">${button('default', 'Сохранить', 'save')}${button('outline', 'Сбросить', 'reset')}${button('destructive', 'Удалить', 'delete')}${button('secondary', 'Ещё', 'more')}</div>
    </div></div>
    <div data-slot="card" class="text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm mx-2 mb-2"><div data-slot="card-content" class="px-6">
      ${row('Системный прокси', sw(true, 'sysproxy'))}
      ${row('Режим TUN', sw(false, 'tun'))}
      ${row('Разрешить LAN', sw(false, 'lan'))}
      ${row('Уровень логов', select('info', 'loglevel'), true)}
    </div></div>
    <div data-slot="accordion" class="mx-2 mb-2 px-6 rounded-xl border text-card-foreground shadow-sm">${['Расширенные настройки', 'DNS', 'Сниффер'].map((t, i) => `<div data-slot="accordion-item" class="border-b last:border-b-0"><h3 class="flex"><button data-accordion="${i}" data-slot="accordion-trigger" data-state="closed" class="flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline cursor-pointer">${t}${svg(LUCIDE.chevron, 'text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200')}</button></h3><div data-slot="accordion-content" data-state="closed" class="overflow-hidden text-sm" hidden><div class="pt-0 pb-4 text-muted-foreground">Здесь в клиенте находятся параметры ядра mihomo: порты, IPv6, правила маршрутизации и другое.</div></div></div>`).join('')}</div>`;

  $('settingsBody').addEventListener('click', (e) => {
    const t = e.target.closest('[data-theme-tab]');
    if (t) {
      const k = t.dataset.themeTab;
      setDark(k === 'system' ? window.matchMedia('(prefers-color-scheme: dark)').matches : k === 'dark');
      document.querySelectorAll('[data-theme-tab]').forEach((x) => x.dataset.state = x === t ? 'active' : 'inactive');
      return;
    }
    const s = e.target.closest('[data-switch]');
    if (s) {
      const on = s.dataset.state !== 'checked';
      s.dataset.state = on ? 'checked' : 'unchecked';
      s.firstElementChild.dataset.state = s.dataset.state;
      return;
    }
    const a = e.target.closest('[data-accordion]');
    if (a) {
      const open = a.dataset.state !== 'open';
      a.dataset.state = open ? 'open' : 'closed';
      a.querySelector('svg').classList.toggle('rotate-180', open);
      const c = a.closest('[data-slot=accordion-item]').querySelector('[data-slot=accordion-content]');
      c.dataset.state = a.dataset.state;
      c.hidden = !open;
      return;
    }
    const sel = e.target.closest('[data-select]');
    if (sel) { openSelect(sel); }
  });

  /* ---------- Порталы: подсказки, меню, тосты, диалоги ---------- */
  const portal = $('portal');
  let tipEl = null;
  function showTip(target) {
    const side = target.dataset.tipSide || 'bottom';
    // Подсказки пунктов меню видны только когда панель свёрнута (как в shadcn Sidebar)
    if (side === 'right' && state.sidebar) return;
    hideTip();
    const r = target.getBoundingClientRect();
    tipEl = document.createElement('div');
    tipEl.className = 'kt-pop';
    tipEl.innerHTML = `<div data-slot="tooltip-content" data-side="${side}" data-state="delayed-open" class="bg-foreground text-background animate-in fade-in-0 zoom-in-95 z-50 w-fit rounded-md px-3 py-1.5 text-xs text-balance relative">${esc(target.dataset.tip)}<svg class="bg-foreground fill-foreground z-50 size-2.5 rotate-45 rounded-[2px] absolute" style="display:block;${side === 'right' ? 'left:-4px;top:50%;margin-top:-5px' : 'top:-4px;left:50%;margin-left:-5px'}" width="10" height="5" viewBox="0 0 30 10"><polygon points="0,0 30,0 15,10"/></svg></div>`;
    portal.appendChild(tipEl);
    const tr = tipEl.firstElementChild.getBoundingClientRect();
    if (side === 'right') { tipEl.style.left = r.right + 10 + 'px'; tipEl.style.top = r.top + r.height / 2 - tr.height / 2 + 'px'; }
    else { tipEl.style.left = Math.max(6, Math.min(innerWidth - tr.width - 6, r.left + r.width / 2 - tr.width / 2)) + 'px'; tipEl.style.top = r.bottom + 8 + 'px'; }
  }
  function hideTip() { tipEl?.remove(); tipEl = null; }
  let tipTimer = 0;
  document.addEventListener('mouseover', (e) => {
    const t = e.target.closest('[data-tip]');
    clearTimeout(tipTimer);
    if (!t) { hideTip(); return; }
    tipTimer = setTimeout(() => showTip(t), 350);
  });
  document.addEventListener('mousedown', hideTip);

  let menuEl = null;
  function closePortals() {
    menuEl?.remove(); menuEl = null;
    document.querySelectorAll('[data-select][data-state=open]').forEach((s) => s.dataset.state = 'closed');
  }
  const MENU_ITEM = 'focus:bg-accent/50 focus:text-foreground hover:bg-accent/50 [&_svg:not([class*=\'text-\'])]:text-foreground/60 relative flex cursor-default items-center gap-2 rounded-xl px-2.5 py-2 text-sm outline-hidden select-none transition-colors [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4';
  function openMenu(anchor, items) {
    closePortals();
    const r = anchor.getBoundingClientRect();
    menuEl = document.createElement('div');
    menuEl.setAttribute('data-radix-popper-content-wrapper', '');
    menuEl.className = 'kt-pop';
    menuEl.innerHTML = `<div data-slot="dropdown-menu-content" role="menu" data-state="open" data-side="bottom" class="bg-card/50 backdrop-blur-xl text-foreground data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 z-50 min-w-[8rem] overflow-x-hidden overflow-y-auto rounded-2xl border border-stroke p-1.5 shadow-lg" style="width:210px">${items.map((it) => it === '-' ? '<div role="separator" data-slot="dropdown-menu-separator" class="bg-stroke -mx-1 my-1 h-px"></div>' : `<div role="menuitem" data-item="${it.id}" data-slot="dropdown-menu-item" ${it.danger ? 'data-variant="destructive"' : ''} class="${MENU_ITEM} ${it.danger ? 'data-[variant=destructive]:text-destructive' : ''}">${it.icon ? svg(LUCIDE[it.icon], '') : ''}${it.label}</div>`).join('')}</div>`;
    portal.appendChild(menuEl);
    const mw = 210;
    menuEl.style.left = Math.min(innerWidth - mw - 8, r.right - mw) + 'px';
    menuEl.style.top = r.bottom + 6 + 'px';
    menuEl.onclick = (e) => {
      const it = e.target.closest('[data-item]');
      if (!it) return;
      const item = items.find((x) => x.id === it.dataset.item);
      closePortals();
      item?.run?.();
    };
    menuEl.onmouseover = (e) => {
      menuEl.querySelectorAll('[data-highlighted]').forEach((x) => x.removeAttribute('data-highlighted'));
      e.target.closest('[data-item]')?.setAttribute('data-highlighted', '');
    };
  }
  function openSelect(trigger) {
    const opts = trigger.dataset.select === 'lang' ? ['Русский', 'English', '简体中文', 'فارسی'] : ['silent', 'error', 'warning', 'info', 'debug'];
    const cur = trigger.querySelector('[data-slot=select-value]').textContent;
    closePortals();
    trigger.dataset.state = 'open';
    const r = trigger.getBoundingClientRect();
    menuEl = document.createElement('div');
    menuEl.className = 'kt-pop';
    menuEl.innerHTML = `<div data-slot="select-content" data-state="open" class="bg-card/50 backdrop-blur-xl text-foreground data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 relative z-50 min-w-[8rem] overflow-hidden rounded-xl border border-stroke shadow-md p-1" style="min-width:${Math.max(140, r.width)}px">${opts.map((o) => `<div data-slot="select-item" data-opt="${o}" class="relative flex w-full cursor-default items-center gap-2 rounded-lg py-1.5 pr-8 pl-2 text-sm outline-hidden select-none hover:bg-accent/50">${o}${o === cur ? `<span class="absolute right-2 flex size-3.5 items-center justify-center">${svg(LUCIDE.check, 'size-4')}</span>` : ''}</div>`).join('')}</div>`;
    portal.appendChild(menuEl);
    menuEl.style.left = r.left + 'px';
    menuEl.style.top = r.bottom + 4 + 'px';
    menuEl.onclick = (e) => {
      const o = e.target.closest('[data-opt]');
      if (!o) return;
      trigger.querySelector('[data-slot=select-value]').textContent = o.dataset.opt;
      closePortals();
    };
  }
  document.addEventListener('click', (e) => {
    const m = e.target.closest('[data-menu]');
    if (m) {
      e.stopPropagation();
      openMenu(m, [
        { id: 'edit', label: 'Редактировать', icon: 'edit', run: () => dialog('edit') },
        { id: 'file', label: 'Открыть файл', icon: 'file' },
        { id: 'upd', label: 'Обновить', icon: 'refresh', run: () => toast('Профиль обновлён', 'success') },
        '-',
        { id: 'del', label: 'Удалить', icon: 'trash', danger: true, run: () => dialog('delete') }
      ]);
      return;
    }
    if (menuEl && !e.target.closest('.kt-pop') && !e.target.closest('[data-select]')) closePortals();
  }, true);

  let toaster = null;
  function toast(text, type = 'info') {
    if (!toaster) {
      const sec = document.createElement('section');
      sec.setAttribute('aria-label', 'Notifications');
      sec.innerHTML = `<ol data-sonner-toaster data-theme="${state.dark ? 'dark' : 'light'}" data-rich-colors="true" data-y-position="bottom" data-x-position="right" class="toaster group kt-toaster" style="--normal-bg:var(--popover);--normal-text:var(--popover-foreground);--normal-border:var(--border);--border-radius:var(--radius)"></ol>`;
      portal.appendChild(sec);
      toaster = sec.firstElementChild;
    }
    const li = document.createElement('li');
    li.setAttribute('data-sonner-toast', '');
    li.dataset.type = type;
    li.dataset.styled = 'true'; li.dataset.mounted = 'true'; li.dataset.visible = 'true';
    li.className = 'kt-toast-enter';
    li.style.cssText = 'width:320px;padding:14px 16px;display:flex;gap:8px;align-items:center;background:var(--normal-bg);color:var(--normal-text);border:1px solid var(--normal-border);border-radius:var(--border-radius);font-size:13px;box-shadow:0 4px 12px rgb(0 0 0 / 10%)';
    li.innerHTML = `<div data-icon>${svg(type === 'success' ? '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>' : '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>')}</div><div data-content><div data-title>${esc(text)}</div></div>`;
    toaster.appendChild(li);
    setTimeout(() => { li.className = 'kt-toast-leave'; setTimeout(() => li.remove(), 220); }, 3200);
  }

  let dlgEl = null;
  function dialog(kind) {
    closeDialog();
    const D = {
      import: ['Импорт профиля', 'Вставьте ссылку на подписку. Профиль появится в списке и будет обновляться автоматически.', true, ['outline', 'Отмена', 'close'], ['default', 'Импортировать', 'ok-import']],
      edit: ['Редактировать профиль', 'Название и интервал обновления подписки.', true, ['outline', 'Отмена', 'close'], ['default', 'Сохранить', 'ok-save']],
      delete: ['Удалить профиль?', 'Профиль и его настройки будут удалены без возможности восстановления.', false, ['outline', 'Отмена', 'close'], ['destructive', 'Удалить', 'ok-delete']],
      quit: ['Выйти из Koala Clash?', 'Подключение будет разорвано, системный прокси - отключён.', false, ['outline', 'Отмена', 'close'], ['destructive', 'Выйти', 'close']]
    }[kind];
    if (!D) return;
    dlgEl = document.createElement('div');
    dlgEl.innerHTML = `<div data-slot="dialog-overlay" data-state="open" class="data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"></div>
      <div role="dialog" data-slot="dialog-content" data-state="open" class="bg-card/50 backdrop-blur-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-2xl border border-stroke p-6 shadow-lg duration-200 outline-none sm:max-w-lg">
        <div data-slot="dialog-header" class="flex flex-col gap-2 text-center sm:text-left"><h2 data-slot="dialog-title" class="text-lg leading-none font-semibold text-foreground">${D[0]}</h2><p data-slot="dialog-description" class="text-foreground/60 text-sm">${D[1]}</p></div>
        ${D[2] ? `<div data-slot="input-group" role="group" class="group/input-group border-stroke relative flex w-full items-center rounded-xl border bg-card/50 backdrop-blur-xl transition-[color,box-shadow] outline-none h-9"><input data-slot="input-group-control" placeholder="${kind === 'edit' ? 'Koala VPN · Premium' : 'https://...'}" class="flex-1 rounded-none border-0 bg-transparent px-3 text-sm shadow-none outline-none"></div>` : ''}
        <div data-slot="dialog-footer" class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">${button(D[3][0], D[3][1], D[3][2], 'default')}${button(D[4][0], D[4][1], D[4][2], 'default')}</div>
        <button data-act="close" class="ring-offset-background absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 cursor-pointer">${svg(LUCIDE.x)}</button>
      </div>`;
    portal.appendChild(dlgEl);
    dlgEl.querySelector('[data-slot=dialog-overlay]').onclick = closeDialog;
  }
  function closeDialog() { dlgEl?.remove(); dlgEl = null; }

  /* Общие действия по data-act */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-act]');
    if (!a) return;
    const act = a.dataset.act;
    if (act === 'close') closeDialog();
    else if (act === 'ok-import') { closeDialog(); toast('Профиль импортирован', 'success'); }
    else if (act === 'ok-save') { closeDialog(); toast('Изменения сохранены', 'success'); }
    else if (act === 'ok-delete') { closeDialog(); toast('Профиль удалён', 'info'); }
    else if (act === 'import') dialog('import');
    else if (act === 'save') toast('Настройки сохранены', 'success');
    else if (act === 'reset') toast('Настройки сброшены', 'info');
    else if (act === 'delete') dialog('delete');
    else if (act === 'more') openMenu(a, [{ id: 'a', label: 'Экспорт настроек', icon: 'file' }, { id: 'b', label: 'Открыть папку', icon: 'file' }]);
    else if (act === 'refresh-profile') { a.classList.add('kt-spin'); setTimeout(() => { a.classList.remove('kt-spin'); toast('Подписка обновлена', 'success'); }, 900); }
    else if (act === 'support') toast('Откроется чат поддержки в Telegram', 'info');
    else if (act === 'close-all') toast('Все подключения закрыты', 'info');
  });
  $('hdrAction').onclick = () => toast(state.page === 'proxies' ? 'Задержки обновлены' : 'Данные обновлены', 'info');
  document.querySelectorAll('[data-wc]').forEach((b) => b.onclick = () => {
    if (b.dataset.wc === 'close') { dialog('quit'); return; }
    const w = $('wrapper');
    w.classList.remove('kt-bump'); void w.offsetWidth; w.classList.add('kt-bump');
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closePortals(); closeDialog(); } });

  /* ---------- Начальная отрисовка ---------- */
  renderProfiles();
  renderProxies();
  renderConns();
  setSidebar(false);

  /* ---------- API для конструктора ---------- */
  const themeEl = $('kt-theme');
  window.KT = {
    setCSS(css) { if (themeEl.textContent !== css) themeEl.textContent = css; },
    setDark,
    go,
    setPower,
    setSidebar,
    replay,
    toast,
    dialog: (kind = 'import') => dialog(kind),
    closeDialog,
    menu() {
      go('profiles');
      setTimeout(() => { const b = document.querySelector('[data-menu]'); if (b) b.click(); }, 30);
    },
    tooltip() {
      const b = document.querySelector('[data-page-link="proxies"]');
      if (b) showTip(b);
    },
    highlight(selector) {
      document.querySelectorAll('.kt-highlight').forEach((x) => x.classList.remove('kt-highlight'));
      if (!selector) return;
      document.querySelectorAll(selector).forEach((x) => x.classList.add('kt-highlight'));
    },
    getState: () => ({ page: state.page, dark: state.dark, power: state.power, sidebar: state.sidebar }),
    listen(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  };
  window.dispatchEvent(new Event('kt-ready'));
  try { window.parent?.postMessage({ type: 'kt-ready' }, '*'); } catch (e) { /* без родителя */ }
})();
