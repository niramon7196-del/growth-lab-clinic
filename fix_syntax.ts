import fs from 'fs';

const file = 'src/components/AssignedExercisesView.tsx';
let content = fs.readFileSync(file, 'utf8');

// Undo the broken closing tag at 645
content = content.replace(
  `                </ErrorBoundary>\n              </div>\n            </motion.div>\n          </div>\n        )}\n      </AnimatePresence>`,
  `              </div>\n            </motion.div>\n          </div>\n        )}\n      </AnimatePresence>`
);

// Then insert </ErrorBoundary> at the actual end of Exercise Detail Modal (around line 834)
content = content.replace(
  `                )}\n              </div>\n            </motion.div>\n          </div>\n        )}\n      </AnimatePresence>\n    </motion.div>`,
  `                )}\n                </ErrorBoundary>\n              </div>\n            </motion.div>\n          </div>\n        )}\n      </AnimatePresence>\n    </motion.div>`
);

fs.writeFileSync(file, content);
console.log('Fixed Syntax Error in AssignedExercisesView');
