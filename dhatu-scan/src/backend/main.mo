import Array "mo:core/Array";
import Float "mo:core/Float";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Time "mo:core/Time";

actor {
  public type Gender = { #male; #female; #other };
  public type WaterSourceType = { #piped; #borehole; #surface; #unprotected };
  public type WHOStatus = { #normal; #underweight; #stunted; #wasted; #severe_wasting };
  public type RiskLevel = { #low; #moderate; #high };
  public type CaptureMode = { #live; #upload };
  public type TipSeverity = { #info; #warning; #critical };

  public type StoredImage = {
    contentType : Text;
    bytes : [Nat8];
  };

  public type LandmarkVisibility = {
    bodyDetected : Nat;
    faceDetected : Nat;
    bodyRequired : Nat;
    faceRequired : Nat;
    fullBodyVisible : Bool;
    adequateLighting : Bool;
    centered : Bool;
    distanceOk : Bool;
    headVisible : Bool;
    feetVisible : Bool;
  };

  public type GuidanceTip = {
    message : Text;
    severity : TipSeverity;
  };

  public type GuidanceResponse = {
    readinessScore : Nat;
    canCapture : Bool;
    tips : [GuidanceTip];
  };

  public type AnthropometryInput = {
    ageMonths : Nat;
    gender : Gender;
    heightCm : Float;
    weightKg : Float;
  };

  public type DietaryInput = {
    dietDiversity : Nat;
    waterSource : WaterSourceType;
    recentDiarrhea : Bool;
    diarrheaFrequency : ?Nat;
    breastfed : ?Bool;
    mealsPerDay : ?Nat;
  };

  public type CaptureMeta = {
    mode : CaptureMode;
    bodyLandmarksDetected : Nat;
    faceLandmarksDetected : Nat;
    faceMasked : Bool;
    modelName : Text;
    modelConfidence : Float;
    embeddingRiskHint : ?Float;
  };

  public type AssessmentRequest = {
    childId : Text;
    childName : Text;
    anthropometry : AnthropometryInput;
    dietary : DietaryInput;
    capture : CaptureMeta;
    originalImage : ?StoredImage;
    maskedImage : ?StoredImage;
  };

  public type ScoreBreakdown = {
    whoZScore : Float;
    whoStatus : WHOStatus;
    wastingScore : Float;
    dietaryScore : Float;
    fusionScore : Float;
    riskLevel : RiskLevel;
  };

  public type Report = {
    id : Text;
    childId : Text;
    childName : Text;
    createdAt : Int;
    capture : CaptureMeta;
    scores : ScoreBreakdown;
    summary : Text;
    recommendations : [Text];
    maskedImage : ?StoredImage;
  };

  public type AssessmentResponse = {
    report : Report;
    privacyNote : Text;
  };

  type WHORef = {
    age : Nat;
    wfaMale : Float;
    wfaFemale : Float;
    hfaMale : Float;
    hfaFemale : Float;
    sdW : Float;
    sdH : Float;
  };

  var reportStore : [Report] = [];
  var idCounter : Nat = 0;

  let WHO_REFS : [WHORef] = [
    { age = 0; wfaMale = 3.3; wfaFemale = 3.2; hfaMale = 49.9; hfaFemale = 49.1; sdW = 0.39; sdH = 1.9 },
    { age = 6; wfaMale = 7.9; wfaFemale = 7.3; hfaMale = 67.6; hfaFemale = 65.7; sdW = 0.78; sdH = 2.4 },
    { age = 12; wfaMale = 9.6; wfaFemale = 8.9; hfaMale = 75.7; hfaFemale = 74.0; sdW = 0.94; sdH = 2.7 },
    { age = 18; wfaMale = 10.9; wfaFemale = 10.2; hfaMale = 82.3; hfaFemale = 80.7; sdW = 1.06; sdH = 2.9 },
    { age = 24; wfaMale = 12.2; wfaFemale = 11.5; hfaMale = 87.8; hfaFemale = 86.4; sdW = 1.18; sdH = 3.1 },
    { age = 36; wfaMale = 14.3; wfaFemale = 13.9; hfaMale = 96.1; hfaFemale = 95.1; sdW = 1.4; sdH = 3.5 },
    { age = 48; wfaMale = 16.3; wfaFemale = 15.9; hfaMale = 103.3; hfaFemale = 102.7; sdW = 1.6; sdH = 3.8 },
    { age = 60; wfaMale = 18.3; wfaFemale = 17.7; hfaMale = 110.0; hfaFemale = 109.4; sdW = 1.8; sdH = 4.0 },
  ];

  func clampFloat(value : Float, min : Float, max : Float) : Float {
    if (value < min) { min } else if (value > max) { max } else { value };
  };

  func clampNat(value : Nat, max : Nat) : Nat {
    if (value > max) { max } else { value };
  };

  func minNat(a : Nat, b : Nat) : Nat {
    if (a < b) { a } else { b };
  };

  func boolScore(flag : Bool, good : Float, bad : Float) : Float {
    if (flag) { good } else { bad };
  };

  func appendOne<T>(arr : [T], item : T) : [T] {
    Array.tabulate<T>(arr.size() + 1, func(i : Nat) : T {
      if (i < arr.size()) { arr[i] } else { item };
    });
  };

  func toFloat(n : Nat) : Float {
    n.toInt().toFloat();
  };

  func round2(value : Float) : Float {
    (value * 100.0).toInt().toFloat() / 100.0;
  };

  func makeReportId() : Text {
    idCounter += 1;
    "rpt_" # Time.now().toText() # "_" # idCounter.toText();
  };

  func waterSourceToScore(source : WaterSourceType) : Nat {
    switch (source) {
      case (#piped) 10;
      case (#borehole) 7;
      case (#surface) 3;
      case (#unprotected) 0;
    };
  };

  func getWHOReference(ageMonths : Nat, gender : Gender) : {
    wfa : Float;
    hfa : Float;
    sdW : Float;
    sdH : Float;
  } {
    var lower : WHORef = WHO_REFS[0];
    var upper : WHORef = WHO_REFS[WHO_REFS.size() - 1];

    if (ageMonths <= WHO_REFS[0].age) {
      lower := WHO_REFS[0];
      upper := WHO_REFS[0];
    } else if (ageMonths >= WHO_REFS[WHO_REFS.size() - 1].age) {
      lower := WHO_REFS[WHO_REFS.size() - 1];
      upper := WHO_REFS[WHO_REFS.size() - 1];
    } else {
      var i : Nat = 0;
      while (i + 1 < WHO_REFS.size()) {
        let a = WHO_REFS[i];
        let b = WHO_REFS[i + 1];
        if (ageMonths >= a.age and ageMonths <= b.age) {
          lower := a;
          upper := b;
        };
        i += 1;
      };
    };

    let span = upper.age - lower.age;
    let t = if (span == 0) {
      0.0;
    } else {
      toFloat(ageMonths - lower.age) / toFloat(span);
    };

    let lowerWfa = switch (gender) {
      case (#female) lower.wfaFemale;
      case (_) lower.wfaMale;
    };
    let upperWfa = switch (gender) {
      case (#female) upper.wfaFemale;
      case (_) upper.wfaMale;
    };
    let lowerHfa = switch (gender) {
      case (#female) lower.hfaFemale;
      case (_) lower.hfaMale;
    };
    let upperHfa = switch (gender) {
      case (#female) upper.hfaFemale;
      case (_) upper.hfaMale;
    };

    {
      wfa = lowerWfa + t * (upperWfa - lowerWfa);
      hfa = lowerHfa + t * (upperHfa - lowerHfa);
      sdW = lower.sdW + t * (upper.sdW - lower.sdW);
      sdH = lower.sdH + t * (upper.sdH - lower.sdH);
    };
  };

  func calculateWHOZScore(input : AnthropometryInput) : {
    zScore : Float;
    status : WHOStatus;
  } {
    let ref = getWHOReference(input.ageMonths, input.gender);
    let wazScore = (input.weightKg - ref.wfa) / (ref.sdW * 2.0);
    let hazScore = (input.heightCm - ref.hfa) / (ref.sdH * 2.0);
    let whzScore = (input.weightKg - ref.wfa * 0.85) / (ref.sdW * 1.5);

    let primary = Float.min(Float.min(wazScore, hazScore), whzScore);

    let status = if (primary >= -1.0) {
      #normal;
    } else if (primary >= -2.0) {
      if (wazScore < -1.0) { #underweight } else { #stunted };
    } else if (primary >= -3.0) {
      if (whzScore < -2.0) { #wasted } else { #stunted };
    } else {
      #severe_wasting;
    };

    { zScore = round2(primary); status };
  };

  func calculateWastingScore(input : AnthropometryInput) : Float {
    if (input.heightCm <= 0.0 or input.weightKg <= 0.0) { return 0.0 };
    let heightM = input.heightCm / 100.0;
    let bmi = input.weightKg / (heightM * heightM);

    let expectedBMI = if (input.ageMonths < 24) {
      17.5;
    } else if (input.ageMonths < 60) {
      16.5;
    } else {
      15.5;
    };
    let bmiDeviation = (expectedBMI - bmi) / expectedBMI;

    let hwRatio = (input.weightKg / input.heightCm) * 100.0;
    let expectedHWRatio = if (input.ageMonths < 12) {
      11.0;
    } else if (input.ageMonths < 36) {
      13.0;
    } else {
      15.0;
    };
    let hwDeviation = (expectedHWRatio - hwRatio) / expectedHWRatio;

    let raw = (bmiDeviation * 0.6 + hwDeviation * 0.4) * 100.0;
    clampFloat(raw, 0.0, 100.0);
  };

  func calculateDietaryScore(input : DietaryInput) : Float {
    let diet = toFloat(clampNat(input.dietDiversity, 10));
    let water = toFloat(waterSourceToScore(input.waterSource));
    let diarrhea = if (input.recentDiarrhea) {
      switch (input.diarrheaFrequency) {
        case (?freq) {
          let penalty = minNat(freq, 10);
          if (penalty >= 10) { 0.0 } else { toFloat(10 - penalty) };
        };
        case null 5.0;
      };
    } else {
      10.0;
    };

    let protective = (0.4 * diet + 0.3 * water + 0.3 * diarrhea) * 10.0;
    let riskScore = 100.0 - protective;
    clampFloat(riskScore, 0.0, 100.0);
  };

  func calculateFusionScore(wasting : Float, dietary : Float, embeddingHint : ?Float) : Float {
    let visualHint = switch (embeddingHint) {
      case (?hint) clampFloat(hint, 0.0, 100.0);
      case null wasting;
    };
    let raw = 0.6 * wasting + 0.25 * dietary + 0.15 * visualHint;
    clampFloat(raw, 0.0, 100.0);
  };

  func riskFromScore(score : Float) : RiskLevel {
    if (score <= 30.0) {
      #low;
    } else if (score <= 60.0) {
      #moderate;
    } else {
      #high;
    };
  };

  func recommendationsForRisk(level : RiskLevel) : [Text] {
    switch (level) {
      case (#low) {
        [
          "Continue regular monthly growth monitoring.",
          "Maintain diverse meals and safe drinking water.",
          "Keep vaccination and deworming schedules updated.",
        ];
      };
      case (#moderate) {
        [
          "Increase meal diversity with protein-rich foods and micronutrients.",
          "Schedule nutrition follow-up within 2 weeks.",
          "Monitor hydration and prevent recurrent diarrhea.",
        ];
      };
      case (#high) {
        [
          "Refer child for urgent pediatric nutrition evaluation.",
          "Begin close weekly follow-up until risk decreases.",
          "Use supervised feeding plan and medical screening for infections.",
        ];
      };
    };
  };

  func summaryText(report : Report) : Text {
    let riskText = switch (report.scores.riskLevel) {
      case (#low) "LOW";
      case (#moderate) "MODERATE";
      case (#high) "HIGH";
    };
    let whoText = switch (report.scores.whoStatus) {
      case (#normal) "Normal";
      case (#underweight) "Underweight";
      case (#stunted) "Stunted";
      case (#wasted) "Wasted";
      case (#severe_wasting) "Severe Wasting";
    };
    let imageText = if (report.maskedImage == null) {
      "No masked image retained."
    } else {
      "Masked image retained for audit/review."
    };

    "Dhatu-Scan Assessment Report\n"
    # "Child: "
    # report.childName
    # " ("
    # report.childId
    # ")\n"
    # "Generated at: "
    # report.createdAt.toText()
    # "\n"
    # "WHO Z-score: "
    # report.scores.whoZScore.toText()
    # " ("
    # whoText
    # ")\n"
    # "Wasting score: "
    # round2(report.scores.wastingScore).toText()
    # "/100\n"
    # "Dietary risk score: "
    # round2(report.scores.dietaryScore).toText()
    # "/100\n"
    # "Fusion score: "
    # round2(report.scores.fusionScore).toText()
    # "/100\n"
    # "Risk level: "
    # riskText
    # "\n"
    # "Capture mode: "
    # (switch (report.capture.mode) { case (#live) "Live Camera"; case (#upload) "Uploaded Photo" })
    # "\n"
    # "Model: "
    # report.capture.modelName
    # " (confidence "
    # round2(report.capture.modelConfidence * 100.0).toText()
    # "%)\n"
    # imageText;
  };

  public query func healthCheck() : async Text {
    "backend-ok";
  };

  public query func evaluateGuidance(input : LandmarkVisibility) : async GuidanceResponse {
    let bodyCoverage = if (input.bodyRequired == 0) {
      1.0;
    } else {
      toFloat(minNat(input.bodyDetected, input.bodyRequired)) / toFloat(input.bodyRequired);
    };
    let faceCoverage = if (input.faceRequired == 0) {
      1.0;
    } else {
      toFloat(minNat(input.faceDetected, input.faceRequired)) / toFloat(input.faceRequired);
    };

    let weighted =
      bodyCoverage * 0.45 +
      faceCoverage * 0.2 +
      boolScore(input.fullBodyVisible, 0.1, 0.0) +
      boolScore(input.centered, 0.08, 0.0) +
      boolScore(input.distanceOk, 0.07, 0.0) +
      boolScore(input.adequateLighting, 0.06, 0.0) +
      boolScore(input.headVisible and input.feetVisible, 0.04, 0.0);

    let score = clampFloat(weighted * 100.0, 0.0, 100.0).toInt().toNat();
    var tips : [GuidanceTip] = [];

    if (bodyCoverage < 0.85) {
      tips := appendOne<GuidanceTip>(tips, { message = "Adjust framing: at least 33 body landmarks must be visible."; severity = #critical });
    };
    if (faceCoverage < 0.85) {
      tips := appendOne<GuidanceTip>(tips, { message = "Adjust face angle/lighting so all 468 facial landmarks are detected."; severity = #warning });
    };
    if (not input.fullBodyVisible) {
      tips := appendOne<GuidanceTip>(tips, { message = "Ensure full body is in frame before capture."; severity = #critical });
    };
    if (not input.headVisible or not input.feetVisible) {
      tips := appendOne<GuidanceTip>(tips, { message = "Head and feet should both be visible for accurate anthropometry."; severity = #warning });
    };
    if (not input.centered) {
      tips := appendOne<GuidanceTip>(tips, { message = "Move child to center of frame."; severity = #info });
    };
    if (not input.distanceOk) {
      tips := appendOne<GuidanceTip>(tips, { message = "Step back to roughly 2 meters for full-body capture."; severity = #info });
    };
    if (not input.adequateLighting) {
      tips := appendOne<GuidanceTip>(tips, { message = "Increase lighting to improve landmark and mask quality."; severity = #warning });
    };
    if (tips.size() == 0) {
      tips := appendOne<GuidanceTip>(tips, { message = "Capture conditions are good. Proceed with scan."; severity = #info });
    };

    let canCapture =
      score >= 80 and
      bodyCoverage >= 0.85 and
      faceCoverage >= 0.85 and
      input.fullBodyVisible and
      input.headVisible and
      input.feetVisible;

    {
      readinessScore = score;
      canCapture;
      tips;
    };
  };

  public func generateAssessmentReport(request : AssessmentRequest) : async AssessmentResponse {
    // `request.originalImage` is intentionally not persisted; it is dropped after this call.
    ignore request.originalImage;

    let who = calculateWHOZScore(request.anthropometry);
    let wastingScore = calculateWastingScore(request.anthropometry);
    let dietaryScore = calculateDietaryScore(request.dietary);
    let fusionScore = calculateFusionScore(wastingScore, dietaryScore, request.capture.embeddingRiskHint);
    let risk = riskFromScore(fusionScore);

    let scores : ScoreBreakdown = {
      whoZScore = who.zScore;
      whoStatus = who.status;
      wastingScore = round2(wastingScore);
      dietaryScore = round2(dietaryScore);
      fusionScore = round2(fusionScore);
      riskLevel = risk;
    };

    let baseReport : Report = {
      id = makeReportId();
      childId = request.childId;
      childName = request.childName;
      createdAt = Time.now();
      capture = request.capture;
      scores;
      summary = "";
      recommendations = recommendationsForRisk(risk);
      maskedImage = request.maskedImage;
    };

    let finalReport = {
      id = baseReport.id;
      childId = baseReport.childId;
      childName = baseReport.childName;
      createdAt = baseReport.createdAt;
      capture = baseReport.capture;
      scores = baseReport.scores;
      summary = summaryText(baseReport);
      recommendations = baseReport.recommendations;
      maskedImage = baseReport.maskedImage;
    };

    reportStore := appendOne<Report>(reportStore, finalReport);

    {
      report = finalReport;
      privacyNote = "Original image is discarded immediately. Only face-masked image is optionally retained.";
    };
  };

  public query func getReport(reportId : Text) : async ?Report {
    for (report in reportStore.vals()) {
      if (report.id == reportId) {
        return ?report;
      };
    };
    null;
  };

  public query func listReports(childId : ?Text) : async [Report] {
    switch (childId) {
      case null reportStore;
      case (?id) {
        var filtered : [Report] = [];
        for (report in reportStore.vals()) {
          if (report.childId == id) {
            filtered := appendOne<Report>(filtered, report);
          };
        };
        filtered;
      };
    };
  };

  public func deleteReport(reportId : Text) : async Bool {
    var remaining : [Report] = [];
    var deleted = false;
    for (report in reportStore.vals()) {
      if (report.id == reportId) {
        deleted := true;
      } else {
        remaining := appendOne<Report>(remaining, report);
      };
    };
    reportStore := remaining;
    deleted;
  };
}
