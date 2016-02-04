f=open('../../input.txt')
data=f.readlines()
numformat='\t%d %d 1\n'  
arr=[7,92]
kformat='\t0.0\t%.2f\n'
flucformat='\t%.3f\n'
arr.append(96)
data[65]='\t58.0\tx\t207.0\t235.0\t-1\n'
data[86]='\t0.22222\t0.01\n'

k=[0.1,0.05,0.5]
fluc=[0.01]

for i in range(1,4):
     for j in range(1,11):
         path=str(i)+'/'+str(j)+'/'

         path=str(i)+'/'+str(j)+'/'
         fw=open(path+'input.txt','w')
         data[arr[0]]= numformat % ((j-1)*100+1 ,(j*100)) 
         data[arr[1]]=kformat % k[i-1]
         data[arr[2]]=flucformat % fluc[0]
         fw.writelines(data)
         fw.close()
         ind=subp.check_call(['cp','../../rjob',path])
         if ind==1:
              exit()

         subp.check_call(['ln','-s','-f','../../../../Ufiles/n3/GerritNew/C1.h5_equ_ufile.cdf',path+'equilibrium.cdf'])
         subp.check_call(['ln','-s','-f','../../../../Trans/trans_58.0_256.5_v2.dat',path+'antenna_pattern.txt'])


for i in range(1,11):
     os.chdir(str(i))
     subp.call('pwd')
     subp.check_call(['qsub','rjob'])
     os.chdir('../')
 