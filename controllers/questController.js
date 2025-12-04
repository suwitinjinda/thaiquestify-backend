const submitQuest = async (req, res) => {
  try {
    const { templateId, submissionData } = req.body;
    const userId = req.user.id;

    // Get the template
    const template = await QuestTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ message: 'Quest template not found' });
    }

    // Handle location verification
    if (template.verificationMethod === 'location_verification') {
      const { userCoordinates, screenshot } = submissionData;
      
      if (!userCoordinates) {
        return res.status(400).json({ message: 'Location coordinates required' });
      }

      const isLocationValid = await locationVerificationService.verifyLocation(
        userCoordinates,
        template.requiredData.get('coordinates'),
        template.requiredData.get('radius') || 100
      );

      if (!isLocationValid) {
        return res.status(400).json({ 
          message: 'You are not at the required location. Please visit the store to complete this quest.' 
        });
      }
    }

    // Create quest submission
    const questSubmission = new QuestSubmission({
      user: userId,
      template: templateId,
      status: template.verificationMethod === 'location_verification' ? 'pending_review' : 'submitted',
      submissionData: submissionData
    });

    await questSubmission.save();

    res.status(201).json({
      message: 'Quest submitted successfully',
      submission: questSubmission
    });

  } catch (error) {
    console.error('Submit quest error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};