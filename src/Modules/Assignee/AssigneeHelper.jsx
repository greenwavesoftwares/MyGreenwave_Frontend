export function addComment(projectId,activityId,moduleId,activityName=''){
    return({
    projectId,
    activityId,
    commentDescription: "",
    commentType: "INFO",
    resolutionDate: "",
    responsibility: "",
    actionPoint: "",
    others: "",
    attachment: null,
    attachmentName: null, // ← NEW: store original file name
    moduleId,
    name:activityName
  })
  }