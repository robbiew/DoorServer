;Door Control file
;-----------------
;
;Sysopfirst: Specifies the first name of the sysop as it will be shown to
;            the users.
;
;SysopLast:  Specifies the last name of the sysop as it will be shown to
;            the users.
;
;BBSName:    Specifies the name of the bbs as it will be shown to users.
;
;Mono:       Will disable color on the local side. (Necessary if you are
;            running a monochrome system)
;
;BBSType:    Specifies the type of bbs software under which this door program
;            will be run. Valid bbs types include:
;
;                    LOCAL - Always log on as local user
;                    SYSOP - Always log on as sysop
;                     RBBS - Rbbs-Pc version 16.1+ (uses DORINFOx.DEF)
;                    QUICK - Quickbbs; Uses DORINFOx.DEF (same as above)
;                    PCB12 - Pcboard version 12 (note: see COMPORT note below)
;                    PCB14 - Pcboard version 14
;                     WWIV - WWIV bbs (uses chain.txt)
;                  PHOENIX - Phoenix bbs
;                  WILDCAT - Wildcat bbs (only versions before WC 3.0!!)
;                  DOORSYS - Any bbs using door.sys (WC 3.0, Gap, etc)
;                 SPITFIRE - Spitfire bbs system (SFDOORS.DAT)
;                      2AM - 2AM-bbs (jumper.dat)
;
;ComPort:    For bbs types that do not have the com-port contained in their
;            door information files (such as PCBOARD-12), you will have to
;            specify the com-port. Simply put the port number (i.e. 1,2,etc)
;            not the whole word COM1.
;
;LockBaud:   This will specify a locked baud rate. If you specify this
;            parameter, then no matter what the bbs software says, this
;            baud rate will be used. [NOTE: You can also specify the locked
;            baud rate using /Bxxxx from the command line]
;
;Internal:   Selecting this option will cause doordriver to use it's internal
;            buffered comm routines. If you do not have a fossil, it is a good
;            idea to use this option.
;
;Oldinternal:Starting with version 3.60, I added some revised comm routines
;            which are now used under the "Internal" keyword. However, if these
;            new routines don't work, then you may use the "oldinternal"
;            keyword to select the older routines.
;
;Maxtime:    The maxtime parameter will allow you to specify a maximum time
;            per session that a user may be in the door. (i.e. if you
;            specified 30 minutes, then if the user had 60 mins left, he could
;            only play for 30 mins)
;
;Status:     Specify "ON" if you wish the status line to appear at the bottom
;            of "OFF" if you wish it to be disabled.
;
;Statfore:   The foreground color of the status line (default 0)
;
;Statback:   The background color of the status line (default 7)
;
;Color1:     Tells doordriver to select ANSI graphics when a "1" is passed
;            in the graphics parameter of the DORINFOx.DEF. From what I
;            understand, FORCE and QUICKBBS require this option set although
;            RBBS should not.
;
;NODIRECT:   This will turn off direct video writing. If you are using
;            desqview and LOD interferes with your other applications, then
;            you may wish to uncomment this line.
;
;NOAUTOMAINT: By Default, LOD will perform maintenance when the first user
;             logs on each day. Thus, the /M maintenance switch is not
;             necessary. However, if you want to control the maintenance
;             runs, then you may uncomment this switch and use the
;             traditional /M command line option to force maintenance.
;
;ANSIRANK:    Specifies the name of the file where ANSI rankings will be
;             placed.
;
;ASCIIRANK:   Specifies the name of the file where ASCII rankings will be
;             placed.
;
;MAXTIME:     Specifies the maximum time per day for each user in minutes.
;             Defaulted to unlimited.
;
;TIMESLICE:   (For Dos REAL mode only) Tells LOD to attempt to determine the
;             multitasker in use and release timeslices while LOD is waiting.
;             Should improve system performance under desqview.
;
;NOSHUTDOWN:  Disables shutdown and/or deinitialization of serial routines
;             upon exit of LOD. Use with caution.
;
SYSOPFIRST SCOTT
SYSOPLAST BAKER
BBSNAME THE NOT-YET-NAMED BBS
;
;       ::::------- Put your bbs type here! Select from those listed above
;       ::::
;       \/\/
BBSTYPE RBBS
;
;                   If you are using a bbs type that doesn't provide the com
;        ::-------- port num in it's door information file (such as pcb-12),
;        \/         then uncomment this line and put your com port here.
;COMPORT 1
;
;          ::------ If you are using a locked com port, then you may wish to
;          \/       un-comment and use this line.
;LOCKBAUD 38400
;
;
;        ::-------- Uncomment this if you DO NOT want to use a fossil driver.
;        \/         (I recommend using a fossil if at all possible)
;INTERNAL
;
;        ::-------- If you insist on not using a fossil driver, and INTERNAL
;        ::         above doesn't work, then try the following instead. (Note,
;        \/         you may use INTERNAL or OLDINTERNAL, but NOT both)
;OLDINTERNAL
;
;                   Uncomment this line if you are running a monochrome
;  ::-------------- system on the local side.
;  \/
;MONO
;
STATUS ON
STATFORE 0
STATBACK 7
;                   Uncomment this if LOD doesn't give color output to users
;  ::-------------- who have color (ansi) selected.
;  \/
;COLOR1
;
;NODIRECT
;
;NOAUTOMAINT
;
ANSIRANK LODRANK.ANS
;
ASCIIRANK LODRANK.ASC
;
;MAXLODTIME 60
;
;TIMESLICE

