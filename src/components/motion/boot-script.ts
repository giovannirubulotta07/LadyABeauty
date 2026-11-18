/**
 * Runs before first paint (inline in <head>): turns entrance animations on,
 * unless the visitor prefers reduced motion. If the animation engine has not
 * started within 4 s (slow network, script blocked), everything is shown.
 */
export const MOTION_BOOT_SCRIPT = `(function(){var d=document.documentElement;if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;d.classList.add('motion');setTimeout(function(){if(!d.classList.contains('motion-ready'))d.classList.add('motion-off')},4000)})();`;
