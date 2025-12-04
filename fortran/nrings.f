C--------------------------------------------------------------------------
C
C PostScript graphics program to generate Conformation Rings.
C 
C A. R. Srinivasan and Wilma K. Olson (1995)
C
C Reference:
C 
C Yeast trna phe conformation wheels: a novel probe of the monoclinic
C and orthorhombic models.
C A. R. Srinivasan and Wilma K. Olson
C Nucleic Acids Research 8, 2307-2330 (1980).
C
C-------------------------------------------------------------------------------
       integer ntor(10)
       real did(5000,8),ix(5000),iy(5000),x(5000),y(5000)
       character*3 al(10),col
       character*80 INPUT,ll,title
       write(*,*)' Type the input file name'
       call blank6
       read (*,1)INPUT
       write(*,1)INPUT
1      format(a80)
       open(unit=9,file=INPUT,status='unknown') 
      
       open(unit=12,file='rings.ps',status='unknown')
       write(12,111)
111    format('%!')
       write(12,*)'newpath'
       call blank6
       write(*,*)' How many types of torsions do you want to represent?'
       call blank6
       write(*,*)' Type the desired # and hit return'
       read (*,*)nc
       write(*,*)nc
       call blank6
       n=0
2      continue
       n=n+1
1008   format(a80)

       read (9,222,end=3)(did(n,j),j=1,7)
       write(*,222)(did(n,j),j=1,7)
 222   format(7x,7f8.1)
c 222   format(4x,7f8.1)
       go to 2
3      continue
       n=n-1
       write(*,*)n
       write(*,*)' Type the array # of the first torsion and return'
       call blank6
       read (*,*)ntor(1)
       do ij=2,nc
         write(*,*)' Type the array # of the next torsion and return'
         call blank6
         read (*,*)ntor(ij)
       end do
       check=(nc+1)/10.0-0.01
       phi=acos(-1.0)
       rint=(nc+1)/((nc+1)*10.0)
       con=phi/180.0
       shift=con*90.0
       see=rint
900    continue
       del=0.0
       s1=250.0
       s2=0.0+300.0
       do 201 i=1,361
        x(i)=see*cos(del)
        y(i)=see*sin(del)
        ix(i)=250*x(i)+300.0
        iy(i)=250*y(i)+350.0
        if(i.eq.1)then
         write(12,11)ix(1),iy(1)
        else
         write(12,22)ix(i),iy(i)
        end if
11     format(f10.2,1x,f10.2,1x,'moveto')
22     format(f10.2,1x,f10.2,1x,'lineto')
       del=del+con
201    continue
       if(see.lt.check)then
       see=see+rint
       go to 900
       end if
       ars=rint
       siva=rint+rint
       jk=0
       write(12,*)'stroke'
       write(12,*)'1.0 setlinewidth'
       write(12,122)
 122   format('/dol {setrgbcolor 4 -2 roll moveto lineto
     1 stroke}def')
        write(12,123)
 123    format('gsave')
       do 301 jj=1,nc
          if(jj.eq.1) col = 'blu'
          if(jj.eq.2) col = 'gre'
          if(jj.eq.3) col = 'red'
          if(jj.eq.4) col = 'yel'
          if(jj.eq.5) col = 'cya'
          if(jj.eq.6) col = 'pur'
          if(jj.eq.7) col = 'gra'
       jk=jk+1
       ntr=ntor(jk)
C
C a value of 999.0 is assigned for non existing torsions
C so that the input table will be complete.
C eg. torsions alpha and beta of the 5'-end.
C
       do 305 i=1,n
        if(did(i,ntr).eq.+999.0)go to 305
        if(did(i,ntr).lt.0.)did(i,ntr)=did(i,ntr)+360.
        airot=did(i,ntr)
        rot=con*(airot)
        rot=-rot+shift
        x1=250.*ars*cos(rot)+300.0
        x2=250.*siva*cos(rot)+300.0
        y1=250.*ars*sin(rot)+350.0
        y2=250.*siva*sin(rot)+350.0
c        write(12,33)x1,y1,x2,y2
        call colnum(col,c11,c12,c13)
        write(12,33)x1,y1,x2,y2,c11,c12,c13

 303    format(3f5.1,' setrgbcolor ')
33     format(f10.2,1x,f10.2,1x,f10.2,1x,f10.2,1x
     1,3f5.1,' dol')
305    continue
       ars=siva
       siva=siva+rint
301    continue
       write(12,*)'newpath'
       siva=ars+0.02
       ang=0.0
       write(12,*)'/Times-Bold findfont 20 scalefont setfont' 
       do 808 i=1,12
       ang=ang+30.
       rot=con*ang
       x1=250.*ars*cos(rot)+300.0
       x2=250.*siva*cos(rot)+300.0
       y1=250.*ars*sin(rot)+350.0
       y2=250.*siva*sin(rot)+350.0
       write(12,33)x1,y1,x2,y2
       if(i.eq.3)then
        x3=x2-6.
        y3=y2+2.
        write(12,66)x3,y3
66     format(2f8.2,' moveto (0) 0 setgray show')
       else if(i.eq.6)then
        x3=x2-23.
        y3=y2
        write(12,661)x3,y3
       else if(i.eq.9)then
        x3=x2-10
        y3=y2-15
        write(12,662)x3,y3
       else if(i.eq.12)then
        x3=x2
        y3=y2+2
        write(12,663)x3,y3
       end if
661    format(2f8.2,' moveto (-90) 0 setgray show')
662    format(2f8.2,' moveto (180) 0 setgray show')
663    format(2f8.2,' moveto ( 90) 0 setgray show')
808    continue
       write(12,*)'stroke'
       write(12,*)'/Symbol findfont 20.0 scalefont setfont'
       write(*,*)' Type labels for each ring: Inner most first'
       write(*,*)' Type a for alpha, b for beta etc.:'
       write(*,*)' carriage return after each label'
       do i=1,nc
        read (*,206)al(i)
       end do
206    format(a3)

       do i=1,nc
        if(i.eq.1)yc=380.0
        if(i.eq.2)yc=403.
        if(i.eq.3)yc=430.
        if(i.eq.4)yc=455.
        if(i.eq.5)yc=481.
        if(i.eq.6)yc=505.
        if(i.eq.7)yc=530.
        if(al(i)(2:2).eq.' ')then
        write(12,207)yc,al(i)
        else if(al(i)(3:3).eq.' ')then
        write(12,208)yc,al(i)
        else         
        write(12,209)yc,al(i)
        end if
       end do
209    format('newpath 300 ',f5.1,' moveto ('a3,') 0 setgray show' )
208    format('newpath 300 ',f5.1,' moveto ('a2,') 0 setgray show' )
207    format('newpath 300 ',f5.1,' moveto ('a1,') 0 setgray show' )
       write(12,*)'stroke'
       write(12,*)'/Times-Bold findfont 20.0 scalefont'
       write(12,*)'setfont'
       write(12,*)'newpath'
       write(12,*)' 220.0 100.0 moveto  ('
       write (*,*)' Type a short title'
       read (*,8008)title
       write(12,8008)title
8008   format(a25)
       write(12,*)') show'
       write(12,*)'stroke'
       write(12,*)'showpage'
       close(unit=9,status='keep')
       close(unit=12,status='keep')
       write(*,*)'Output is saved in rings.ps:'
       write(*,*)'rings.ps is a PostScript file:'
       write(*,*)'rings.ps can be viewed through Ghostview:'
       stop
       end
C-------------------------------------------------------------------------------
       subroutine blank6
       write(*,*)' '
       return
       end
C-------------------------------------------------------------------------------
C---------------------------------------------------------------------
C
C Yes/No decision maker.
C If yes, np is returned as 1.
C If not, np = 0
C 1/0 may be used to switch control in the program to different places
C
C---------------------------------------------------------------------
        subroutine decide(np)
        character*20 yorno
        write(*,*)' Type yes or no and return:'
        read (*,99)yorno
99      format(a20)
        write(*,99)yorno
        np=0
        if((yorno(1:1).eq.'Y').or.(yorno(1:1).eq.'y'))np=1
        write(*,*)np
        return
        end
C--------------------------------------------------------------------
C----------------------------------------------------------------------
       subroutine colnum(col,c1,c2,c3)
       character*3 col
907    format(a3)
       c1=0.
       c2=0.
       c3=0.
       if(col.eq.'blu')then
       c1=0.
       c2=0.
       c3=1.
       else if(col.eq.'gre')then
       c1=0.
       c2=1.
       c3=0.
       else if(col.eq.'red')then
       c1=1.0
       c2=0.
       c3=0.
       else if(col.eq.'yel')then
       c1=1.
       c2=1.
       c3=0.
       else if(col.eq.'cya')then
       c1=0.
       c2=1.
       c3=1.
       else if(col.eq.'whi')then
       c1=1.
       c2=1.
       c3=1.
       else if(col.eq.'dgr')then
       c1=0.0
       c2=0.5
       c3=0.0
       else if(col.eq.'amb')then
       c1=0.5
       c2=0.5
       c3=0.0
       else if(col.eq.'gra')then
       c1=0.5
       c2=0.5
       c3=0.5
       else if(col.eq.'lgr')then
       c1=0.5
       c2=1.0
       c3=0.5
       else if(col.eq.'tur')then
       c1=0.0
       c2=0.5
       c3=0.5
       else if(col.eq.'pur')then
       c1=0.5
       c2=0.0
       c3=0.5
       else if(col.eq.'ora')then
       c1=1.0
       c2=0.5
       c3=0.0
       else if(col.eq.'bla')then
       c1=0.
       c2=0.
       c3=0.
       endif
       return
       end

C---------------------------------------------------------------------
