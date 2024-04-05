browser.menus.create ({
	id: "quick-abstract-menu",
	title: "Quick Abstract",
	icons: {
		16: "../icons/icon16.png",
		32: "../icons/icon32.png"
	},
	contexts: ["selection"]

});

browser.menus.onClicked.addListener((info, tab) => {
  
  if(info.menuItemId === "quick-abstract-menu")
  	console.log("menu pressed!");

});
