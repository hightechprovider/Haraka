// RFC 1869 email address parser

// 6.  MAIL FROM and RCPT TO Parameters
// [...]
//
//   esmtp-cmd        ::= inner-esmtp-cmd [SP esmtp-parameters] CR LF
//   esmtp-parameters ::= esmtp-parameter *(SP esmtp-parameter)
//   esmtp-parameter  ::= esmtp-keyword ["=" esmtp-value]
//   esmtp-keyword    ::= (ALPHA / DIGIT) *(ALPHA / DIGIT / "-")
//
//                        ; syntax and values depend on esmtp-keyword
//   esmtp-value      ::= 1*<any CHAR excluding "=", SP, and all
//                           control characters (US ASCII 0-31
//                           inclusive)>
//
//                        ; The following commands are extended to
//                        ; accept extended parameters.
//   inner-esmtp-cmd  ::= ("MAIL FROM:" reverse-path)   /
//                        ("RCPT TO:" forward-path)

var chew_regexp = /\s+([A-Za-z0-9][A-Za-z0-9\-]*(=[^= \x00-\x1f]+)?)$/;

exports.parse = function(type, line) {
    var params = [];
    line = (new String(line)).replace(/\s*$/, '');
    if (type === "mail") {
        line = line.replace(/from:/i, "");
    }
    else {
        line = line.replace(/to:/i, "");
    }
    
    var matches;
    while (matches = chew_regexp.exec(line)) {
        params.push(matches[1]);
        line = line.slice(matches[1].length);
    }
    params = params.reverse();
    
    // the above will "fail" (i.e. all of the line in params) on 
    // some addresses without <> like
    //    MAIL FROM: user=name@example.net
    // or RCPT TO: postmaster

    // let's see if $line contains nothing and use the first value as address:
    if (line.length) {
        // parameter syntax error, i.e. not all of the arguments were 
        // stripped by the while() loop:
        if (line.match(/\@.*\s/)) {
            throw "Syntax error in parameters";
        }
        
        params.unshift(line);
        
        return params;
    }

    line = params.shift();
    if (type === "mail") {
        if (!line.length) {
            return ["<>"]; // 'MAIL FROM:' --> 'MAIL FROM:<>'
        }
        if (line.match(/\@.*\s/)) {
            throw "Syntax error in parameters";
        }
    }
    else {
        if (line.match(/\@.*\s/)) {
            throw "Syntax error in parameters";
        } 
        else {
            if (line.match(/\s/))
                throw "Syntax error in parameters";
            if (!line.match(/^(postmaster|abuse)$/i))
                throw "Syntax error in address";
        }
    }
    
    params.unshift(line);
    
    return params;
}
