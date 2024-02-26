export async function customDialogConfirm(sTitle, sQuestion, answerOneCaption = 'Ok', answerTwoCaption = 'Cancel') {
  let dialogid = 'custom-dialog-confirm-' + randomID();
  let dialog = new Promise((resolve, reject) => {
    new Dialog({
      title: sTitle,
      content: `<span id="${dialogid}"></span>` + sQuestion,
      buttons: {
        ok: {
          icon: '<i class ="fas fa-check"></i>',
          label: answerOneCaption,
          callback: () => {
            resolve(true);
          }
        },
        cancel: {
          icon: '<i class ="fas fa-times"></i>',
          label: answerTwoCaption,
          callback: () => {
            resolve(false);
          }
        }
      },
      default: "ok",
      render: () => {
        // set icon in dialog title
        addIconToCustomDialog(dialogid, 'far fa-circle-question');
      },
      close: () => {
        resolve(false);
      }
    }).render(true);
  });
  let answer = await dialog;
  return answer;
}

function addIconToCustomDialog(dialogid, icon) {
  let dialogidelement = document.getElementById(dialogid);
  if (dialogidelement != null) {
    let dialogapp = dialogidelement.closest('.dialog');
    if (dialogapp != null) {
      let dialogtitle = dialogapp.getElementsByClassName("window-title");
      if (dialogtitle != null) {
        if (dialogtitle.length > 0) {
          dialogtitle[0].innerHTML = '<i class="' + icon + '"></i> ' + dialogtitle[0].innerHTML;
        }
      }
    }
  }
}