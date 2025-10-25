app.post('/course/:courseId/videos/upload', upload.single('video_file'), async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const { chapter_title, topic_title, video_title } = req.body;
    const filePath = req.file.filename; // assuming multer saves file to 'uploads/' folder

    //  Check if chapter exists
    let chapterResult = await pool.query(
      'SELECT * FROM chapters WHERE course_id=$1 AND title=$2',
      [courseId, chapter_title.trim()]
    );

    let chapterId;
    if (chapterResult.rows.length > 0) {
      chapterId = chapterResult.rows[0].id;
    } else {
      // Chapter doesn't exist, create it
      const newChapter = await pool.query(
        'INSERT INTO chapters (course_id, title) VALUES ($1, $2) RETURNING id',
        [courseId, chapter_title.trim()]
      );
      chapterId = newChapter.rows[0].id;
    }

    //  Check if topic exists under this chapter
    let topicResult = await pool.query(
      'SELECT * FROM topics WHERE chapter_id=$1 AND title=$2',
      [chapterId, topic_title.trim()]
    );

    let topicId;
    if (topicResult.rows.length > 0) {
      topicId = topicResult.rows[0].id;
    } else {
      // Topic doesn't exist, create it
      const newTopic = await pool.query(
        'INSERT INTO topics (chapter_id, title) VALUES ($1, $2) RETURNING id',
        [chapterId, topic_title.trim()]
      );
      topicId = newTopic.rows[0].id;
    }

    //  Insert video
    await pool.query(
      'INSERT INTO videos (topic_id, title, file_path) VALUES ($1, $2, $3)',
      [topicId, video_title.trim(), filePath]
    );

    res.redirect(`/course/${courseId}`); // back to course page
  } catch (err) {
    console.error(err);
    res.send('Error uploading video: ' + err.message);
  }
});